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
  cartItems,
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
import { TRPCError } from "@trpc/server";
import { Stripe } from "stripe";
import { env } from "~/env.js";
import { getUserOrdersInputSchema } from "~/type";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const orderRouter = createTRPCRouter({
  /**
   * Fulfills an order. Called from the /payment/success page.
   * Retrieves the Stripe session, verifies payment, and updates the order status.
   */
  fulfillOrder: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      let session: Stripe.Checkout.Session;
      try {
        // 1. Get the Stripe session
        session = await stripe.checkout.sessions.retrieve(input.sessionId, {
          expand: [
            "payment_intent.payment_method",
            "total_details",
            "shipping_cost.shipping_rate",
          ],
        });
      } catch (error) {
        console.error("Failed to retrieve Stripe session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve payment session.",
        });
      }

      if (session.payment_status !== "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment not successful.",
        });
      }

      const orderId = session.metadata?.orderId;
      if (!orderId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No orderId in session metadata.",
        });
      }

      // --- This is the new transactional logic ---
      try {
        const updatedOrder = await ctx.db.transaction(async (tx) => {
          // 2. Get the order items from our database
          const itemsInOrder = await tx.query.orderItems.findMany({
            where: eq(orderItems.orderId, orderId),
          });

          if (itemsInOrder.length === 0) {
            throw new Error("No items found for this order.");
          }

          // 3. Decrement stock for each item (ATOMICALLY)
          for (const item of itemsInOrder) {
            const updateResult = await tx
              .update(productVariants)
              .set({
                stock: sql`${productVariants.stock} - ${item.quantity}`,
              })
              .where(
                and(
                  eq(productVariants.id, item.productVariantId),
                  // This 'WHERE stock >= quantity' check is the atomic part
                  // that prevents the race condition.
                  sql`${productVariants.stock} >= ${item.quantity}`,
                ),
              )
              .returning({ id: productVariants.id });

            // If updateResult is empty, it means the stock was insufficient.
            // The 'WHERE' clause failed, so no rows were updated.
            if (updateResult.length === 0) {
              const productInfo = await tx.query.productVariants.findFirst({
                where: eq(productVariants.id, item.productVariantId),
                with: { product: { columns: { name: true } } },
              });
              const productName = productInfo?.product.name ?? "Product";
              throw new TRPCError({
                code: "CONFLICT",
                message: `Sorry, ${productName} (${item.quantity}x) went out of stock just before your payment was confirmed. Your order has been cancelled.`,
              });
            }
          }

          // 4. Clear the user's DB cart (if they are logged in)
          const userId = session.metadata?.userId;
          if (userId && userId !== "guest") {
            await tx.delete(cartItems).where(eq(cartItems.userId, userId));
          }

          console.log(
            "Complete session object:",
            JSON.stringify(session, null, 2),
          );

          // 5. Update the order status to 'paid'
          const taxAmount = (session.total_details?.amount_tax ?? 0) / 100;
          const shippingAmount =
            (session.total_details?.amount_shipping ?? 0) / 100;
          const grandTotal = (session.amount_total ?? 0) / 100;

          const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
          const paymentMethod =
            paymentIntent.payment_method as Stripe.PaymentMethod;
          const card = paymentMethod?.card; // This contains brand and last4

          // console.log("paymentMethod: ", paymentIntent);

          const shippingRate = session.shipping_cost
            ?.shipping_rate as Stripe.ShippingRate;
          const shippingDetails =
            session.collected_information?.shipping_details;
          const billingDetails = paymentMethod.billing_details;

          const [finalOrder] = await tx
            .update(orders)
            .set({
              status: "paid",
              tax: taxAmount.toFixed(2),
              shippingFee: shippingAmount.toFixed(2),
              totalAmount: grandTotal.toFixed(2),

              paymentIntentId: paymentIntent.id,
              cardBrand: card?.brand ?? null, // Save brand (e.g., "visa")
              cardLast4: card?.last4 ?? null, // Save last 4 digits

              shippingMethod: shippingRate?.display_name ?? undefined,
              shippingTime: shippingRate?.delivery_estimate
                ? JSON.stringify(shippingRate?.delivery_estimate)
                : undefined,

              shippingAddress: shippingDetails?.address
                ? JSON.stringify(shippingDetails.address)
                : undefined,
              shippingName: shippingDetails?.name ?? undefined,
              billingAddress: billingDetails?.address
                ? JSON.stringify(billingDetails.address)
                : undefined,
              billingName: billingDetails?.name ?? undefined,
            })
            .where(eq(orders.id, orderId))
            .returning();

          if (!finalOrder) {
            throw new Error(
              "Failed to find and update order after processing.",
            );
          }

          return finalOrder;
        });

        // --- End of transaction ---

        // (Optional: Send a confirmation email here)

        return { success: true, orderId: updatedOrder.id };
      } catch (error) {
        console.error("Failed to fulfill order:", error);

        // If our transaction failed (e.g., stock issue), we MUST cancel the order
        // and ideally refund the payment.
        await ctx.db
          .update(orders)
          .set({ status: "abandoned", statusReason: "abandoned_out_of_stock" })
          .where(eq(orders.id, orderId));

        // TODO: Handle refund with Stripe here if payment was captured but stock failed
        // For now, we just throw the error message from the transaction.

        if (error instanceof TRPCError) {
          throw error; // Re-throw the specific "Out of stock" error
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to process your order after payment. Please contact support.",
        });
      }
    }),
  // ... rest of the file (getMyOrders)

  /**
   * Get filtered orders for the currently logged-in user.
   */
  getUserOrders: protectedProcedure
    .input(getUserOrdersInputSchema) // Use the new schema
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
      if (carrier) {
        conditions.push(ilike(orders.carrier, `%${carrier}%`));
      }
      if (trackingNumber) {
        conditions.push(ilike(orders.trackingNumber, `%${trackingNumber}%`));
      }

      const whereClause = and(...conditions);

      // 2. Build Sort Clause
      let orderByClause;
      switch (sort) {
        case "date-asc":
          orderByClause = asc(orders.createdAt);
          break;
        case "price-desc":
          orderByClause = desc(orders.subtotal);
          break;
        case "price-asc":
          orderByClause = asc(orders.subtotal);
          break;
        case "date-desc":
        default:
          orderByClause = desc(orders.createdAt);
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
        orderBy: [desc(orders.createdAt)],
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
                  product: {
                    columns: { name: true },
                  },
                },
              },
            },
          },
        },
      });

      return {
        orders: userOrders,
        totalPages,
        currentPage: page,
      };
    }),
});
