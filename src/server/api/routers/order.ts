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
} from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { Stripe } from "stripe";
import { env } from "~/env.js";
import { getOrdersInputSchema } from "~/type";

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
          // We MUST expand shipping_details and payment_intent
          expand: ["payment_intent"],
        }); // --- NO EXPAND OPTION IS NEEDED ---
      } catch (error) {
        // --- END: REPLACEMENT ---
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
          const [finalOrder] = await tx
            .update(orders)
            .set({
              status: "paid",
              paymentIntentId: (session.payment_intent as Stripe.PaymentIntent)
                .id,
              shippingAddress: session.collected_information?.shipping_details
                ?.address
                ? JSON.stringify(
                    session.collected_information.shipping_details.address,
                  ) // This is the shipping address
                : undefined,
              billingAddress: session.customer_details?.address
                ? JSON.stringify(session.customer_details.address) // This contains billing info
                : undefined,
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
          .set({ status: "cancelled" })
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
  getMyOrders: protectedProcedure
    .input(getOrdersInputSchema) // Use the new schema
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const {
        page,
        pageSize,
        id,
        status,
        dateMin,
        dateMax,
        priceMin,
        priceMax,
        carrier,
        trackingNumber,
      } = input;

      // 1. Build Conditions
      const conditions = [
        eq(orders.userId, userId),
        // Note: If you want to restrict to only "paid/shipped", keep this:
        // inArray(orders.status, ["paid", "shipped"])
        // Or, if using filters, rely on the user's filter or allow all non-pending:
        inArray(orders.status, ["paid", "shipped"]),
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
      if (priceMin !== undefined) {
        conditions.push(gte(orders.totalAmount, priceMin.toString()));
      }
      if (priceMax !== undefined) {
        conditions.push(lte(orders.totalAmount, priceMax.toString()));
      }
      if (carrier) {
        conditions.push(ilike(orders.carrier, `%${carrier}%`));
      }
      if (trackingNumber) {
        conditions.push(ilike(orders.trackingNumber, `%${trackingNumber}%`));
      }

      const whereClause = and(...conditions);

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
