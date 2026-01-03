import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  orders,
  orderItems,
  productVariants,
  products,
  users,
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
  or,
} from "drizzle-orm";
// import { TRPCError } from "@trpc/server";
import { Stripe } from "stripe";
import { env } from "~/env.js";
import { getAdminOrdersInputSchema, getUserOrdersInputSchema } from "~/type";
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

  /**
   * Get all orders in the system (Admin Only) with Filters & Sorting
   * This procedure needs inArray and in memory sorting b/c it needs more than 1 table (orders + users)
   */
  getAdminOrders: adminProcedure
    .input(getAdminOrdersInputSchema)
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        id,
        dateMin,
        dateMax,
        customerName,
        customerEmail,
        itemsMin,
        itemsMax,
        itemName,
        priceMin,
        priceMax,
        status,
        carrier,
        trackingNumber,
        sort,
      } = input;

      // 1. Build Where Conditions
      const conditions = [];

      if (id) conditions.push(ilike(orders.id, `%${id}%`));

      if (dateMin) conditions.push(gte(orders.createdAt, new Date(dateMin)));
      if (dateMax) {
        const d = new Date(dateMax);
        d.setHours(23, 59, 59, 999);
        conditions.push(lte(orders.createdAt, d));
      }

      if (customerName) {
        // Filter by user name (only applies to logged-in users)
        conditions.push(ilike(users.name, `%${customerName}%`));
      }

      if (customerEmail) {
        // Check both registered email OR guest email
        conditions.push(
          or(
            ilike(users.email, `%${customerEmail}%`),
            ilike(orders.guestEmail, `%${customerEmail}%`),
          ),
        );
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

      if (priceMin) conditions.push(gte(orders.subtotal, priceMin.toString()));
      if (priceMax) conditions.push(lte(orders.subtotal, priceMax.toString()));

      if (status && status.length > 0) {
        conditions.push(inArray(orders.status, status as any[]));
      }

      // if (carrier) conditions.push(ilike(orders.carrier, `%${carrier}%`));
      // if (trackingNumber)
      //   conditions.push(ilike(orders.trackingNumber, `%${trackingNumber}%`));

      const whereClause = and(...conditions);

      // 2. Build Sort Clause
      let orderByClause;
      switch (sort) {
        case "date-asc":
          orderByClause = asc(orders.createdAt);
          break;
        case "price-desc":
          orderByClause = desc(orders.totalAmount);
          break;
        case "price-asc":
          orderByClause = asc(orders.totalAmount);
          break;
        case "name-desc":
          orderByClause = desc(users.name);
          break;
        case "name-asc":
          orderByClause = asc(users.name);
          break;
        case "email-desc":
          // Sort by coalesced email
          orderByClause = sql`COALESCE(${users.email}, ${orders.guestEmail}) DESC`;
          break;
        case "email-asc":
          orderByClause = sql`COALESCE(${users.email}, ${orders.guestEmail}) ASC`;
          break;
        case "date-desc":
        default:
          orderByClause = desc(orders.createdAt);
          break;
      }

      // 3. Pagination Count (Joined with users for filtering)
      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(whereClause);

      const totalItems = totalResult?.count ?? 0;
      const totalPages = Math.ceil(totalItems / pageSize);

      // 4. Fetch Data (Manually join to allow filtering/sorting on user fields)
      // We use .select().from().leftJoin() instead of .query.findMany() to strictly control the Join
      // needed for filtering/sorting, but then we need to reconstruct the nested objects if we want relations.
      // OR we can use findMany if we pass the ID list.

      // Strategy: Get IDs first using the complex filter/sort
      const rows = await ctx.db
        .select({
          id: orders.id,
          // We select sort columns to ensure order is preserved if needed, though usually ID list is enough if we map back
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const orderIds = rows.map((r) => r.id);

      if (orderIds.length === 0) {
        return { orders: [], totalPages, currentPage: page };
      }

      // 5. Fetch full object data for these IDs using relational query
      // Note: This second query might return items in a different order, so we re-sort in JS.
      const allOrders = await ctx.db.query.orders.findMany({
        where: inArray(orders.id, orderIds),
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

      // 6. Re-sort in memory to match the given sort order (since 'inArray' doesn't guarantee order)
      // We can map the orderIds to the result.
      const orderMap = new Map(allOrders.map((o) => [o.id, o]));
      const sortedOrders = orderIds.map((id) => orderMap.get(id)!);

      // 7. sort order items in each order
      sortedOrders.forEach((order) => {
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
        orders: sortedOrders,
        totalPages,
        currentPage: page,
      };
    }),
});
