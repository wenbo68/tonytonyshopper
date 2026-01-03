import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  orders,
  orderItems,
  productVariants,
  products,
  // cartItems,
  // type OrderItemStatus,
} from "~/server/db/schema";
import {
  eq,
  desc,
  and,
  sql,
  inArray,
  count,
  ilike,
  lte,
  gte,
  asc,
} from "drizzle-orm";
// import { TRPCError } from "@trpc/server";
import { Stripe } from "stripe";
import { env } from "~/env.js";
import { getUserOrdersInputSchema } from "~/type";
import {
  getOrderItemStatusPriority,
  // updateOrderItem,
} from "~/server/utils/order";
import { formatProductOptionsCaption } from "~/server/utils/product";
// import { rejectReturnReasonConst, returnReasonConst } from "~/const";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const orderRouter = createTRPCRouter({
  checkOrderStatusByStripeSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Find the order that has this sessionId (via Stripe or your internal metadata)
      // Since your metadata has orderId, we can retrieve the session from Stripe first
      const session = await stripe.checkout.sessions.retrieve(input.sessionId);
      const orderId = session.metadata?.orderId;

      if (!orderId) return { status: "not_found" };

      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { status: true, statusReason: true },
      });

      return {
        status: order?.status,
        reason: order?.statusReason ?? null,
      };
    }),

  /**
   * Get filtered orders for the currently logged-in user.
   */
  getUserOrders: protectedProcedure
    .input(getUserOrdersInputSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const {
        page,
        pageSize,
        id,
        status,
        dateMin,
        dateMax,
        itemsMin,
        itemsMax,
        itemName,
        priceMin,
        priceMax,
        carrier,
        trackingNumber,
        sort,
      } = input;

      // 1. Build Conditions
      const conditions = [
        eq(orders.userId, userId),
        // Note: If you want to restrict to only "paid/shipped", keep this:
        // inArray(orders.status, ["paid", "shipped"])
        // Or, if using filters, rely on the user's filter or allow all non-pending:
        inArray(orders.status, ["paid"]),
      ];

      if (id) {
        conditions.push(ilike(orders.id, `%${id}%`));
      }
      if (status && status.length > 0) {
        // We cast status to any because Zod enum matches Drizzle enum strings
        conditions.push(inArray(orders.status, status as any[]));
      }
      if (dateMin) {
        conditions.push(gte(orders.createdAt, new Date(dateMin)));
      }
      if (dateMax) {
        // Set time to end of day
        const d = new Date(dateMax);
        d.setHours(23, 59, 59, 999);
        conditions.push(lte(orders.createdAt, d));
      }
      if (itemsMin || itemsMax) {
        // Create a subquery to find order IDs that match the item count criteria
        const subQuery = ctx.db
          .select({ orderId: orderItems.orderId })
          .from(orderItems)
          .groupBy(orderItems.orderId)
          .having(
            and(
              itemsMin
                ? gte(sql`sum(${orderItems.quantity})`, itemsMin)
                : undefined,
              itemsMax
                ? lte(sql`sum(${orderItems.quantity})`, itemsMax)
                : undefined,
            ),
          );

        // Filter the main orders query to only include IDs returned by the subquery
        conditions.push(inArray(orders.id, subQuery));
      }
      if (itemName) {
        // Find orders that contain an item with a matching product name
        const itemSubQuery = ctx.db
          .select({ orderId: orderItems.orderId })
          .from(orderItems)
          .innerJoin(
            productVariants,
            eq(orderItems.productVariantId, productVariants.id),
          )
          .innerJoin(products, eq(productVariants.productId, products.id))
          .where(ilike(products.name, `%${itemName}%`)); // Case-insensitive match

        conditions.push(inArray(orders.id, itemSubQuery));
      }
      if (priceMin) {
        conditions.push(gte(orders.subtotal, priceMin.toString()));
      }
      if (priceMax) {
        conditions.push(lte(orders.subtotal, priceMax.toString()));
      }

      const whereClause = and(...conditions);

      // 2. Build Sort Clause
      let orderByClause;
      switch (sort) {
        case "date-desc":
          orderByClause = desc(orders.createdAt);
          break;
        case "date-asc":
          orderByClause = asc(orders.createdAt);
          break;
        case "price-desc":
          orderByClause = desc(orders.totalAmount);
          break;
        case "price-asc":
          orderByClause = asc(orders.totalAmount);
          break;
      }

      // 2. Pagination: Get total count
      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(orders)
        .where(whereClause);
      const totalItems = totalResult?.count ?? 0;
      const totalPages = Math.ceil(totalItems / pageSize);

      // 3. Fetch Data
      const userOrders = await ctx.db.query.orders.findMany({
        where: whereClause,
        orderBy: [orderByClause],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        with: {
          user: {
            columns: { name: true, email: true, image: true },
          },
          orderItems: {
            with: {
              productVariant: {
                with: {
                  media: true,
                  product: {
                    columns: { name: true },
                  },
                },
              },
            },
          },
        },
      });

      // 4. Sort Order Items In-Memory
      userOrders.forEach((order) => {
        order.orderItems.sort((a, b) => {
          // A. Primary Sort: Product Name
          const prodNameA = a.productVariant.product.name.toLowerCase();
          const prodNameB = b.productVariant.product.name.toLowerCase();
          if (prodNameA < prodNameB) return -1;
          if (prodNameA > prodNameB) return 1;

          // B. Secondary Sort: Variant Name (Options)
          const variantNameA =
            formatProductOptionsCaption(
              a.productVariant.options,
            )?.toLowerCase() ?? "";
          const variantNameB =
            formatProductOptionsCaption(
              b.productVariant.options,
            )?.toLowerCase() ?? "";
          if (variantNameA < variantNameB) return -1;
          if (variantNameA > variantNameB) return 1;

          // C. Tertiary Sort: Status (Custom Order)
          const priorityA = getOrderItemStatusPriority(a.status);
          const priorityB = getOrderItemStatusPriority(b.status);

          return priorityA - priorityB;
        });
      });

      return {
        orders: userOrders,
        totalPages,
        currentPage: page,
      };
    }),
});
