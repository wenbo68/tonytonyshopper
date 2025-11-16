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
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { Stripe } from "stripe";
import { env } from "~/env.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// type ExpandedSession = Stripe.Checkout.Session & {
//   shipping_details?: {
//     address: Stripe.Address | null;
//     name?: string | null;
//     phone?: string | null;
//   } | null;
//   customer_details?: {
//     address: Stripe.Address | null;
//     email?: string | null;
//     name?: string | null;
//     phone?: string | null;
//   } | null;
// };

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
   * Get all orders for the currently logged-in user.
   */
  getMyOrders: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const userOrders = await ctx.db.query.orders.findMany({
      where: and(
        eq(orders.userId, userId),
        eq(orders.status, "paid"), // Only show completed orders
      ),
      orderBy: [desc(orders.createdAt)],
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

    return userOrders;
  }),
});
