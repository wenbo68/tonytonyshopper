// Path: ~/server/api/routers/stripe.ts
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  cartItems,
  orderItems,
  orders,
  productVariants,
} from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm"; //
import { Stripe } from "stripe";
import { env } from "~/env.js";
import { TRPCError } from "@trpc/server";
import { v4 } from "uuid";

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const stripeRouter = createTRPCRouter({
  createCheckoutSession: publicProcedure
    .input(
      z.array(
        z.object({
          productVariantId: z.string(),
          quantity: z.number().min(0),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cart is empty.",
        });
      }

      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      const baseUrl = getBaseUrl();
      const variantIds = input.map((item) => item.productVariantId);

      // --- NEW: Clean up old 'pending' orders for this user ---
      // This ensures we don't reuse stale orders or leave a mess of pending orders
      // visible to the user/admin if they abandon checkout repeatedly.
      if (ctx.session?.user) {
        await ctx.db
          .update(orders)
          .set({ status: "cancelled" })
          .where(
            and(
              eq(orders.userId, ctx.session.user.id),
              eq(orders.status, "pending"),
            ),
          );
      }
      // --------------------------------------------------------

      // 1. SECURELY fetch product details from your DB
      const dbVariants = await ctx.db.query.productVariants.findMany({
        where: inArray(productVariants.id, variantIds),
        with: {
          product: {
            columns: { name: true },
          },
        },
      });

      // 2. Create the line_items array AND calculate total
      let totalAmount = 0;
      const lineItems = input.map((cartItem) => {
        const dbVariant = dbVariants.find(
          (v) => v.id === cartItem.productVariantId,
        );

        if (!dbVariant) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Product variant with ID ${cartItem.productVariantId} not found.`,
          });
        }
        if (dbVariant.stock < cartItem.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Not enough stock for ${dbVariant.product.name} - ${dbVariant.name}. Only ${dbVariant.stock} left.`,
          });
        }

        const unitAmount = Math.round(parseFloat(dbVariant.price) * 100);
        totalAmount += unitAmount * cartItem.quantity;

        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${dbVariant.product.name} - ${dbVariant.name ?? ""}`.trim(),
            },
            unit_amount: unitAmount,
          },
          quantity: cartItem.quantity,
        };
      });

      // 3. --- Create a 'pending' order in our database ---
      let newOrderId: string | null = null;
      try {
        const [newOrder] = await ctx.db
          .insert(orders)
          .values({
            id: `order_${v4()}`,
            userId: ctx.session?.user?.id,
            guestEmail: ctx.session?.user?.email,
            totalAmount: (totalAmount / 100).toFixed(2),
            status: "pending",
          })
          .returning({ id: orders.id });

        if (!newOrder?.id) {
          throw new Error("Failed to create order.");
        }
        newOrderId = newOrder.id;

        // 3b. Create the associated order items
        await ctx.db.insert(orderItems).values(
          input.map((cartItem) => {
            const dbVariant = dbVariants.find(
              (v) => v.id === cartItem.productVariantId,
            )!;
            return {
              id: `item_${v4()}`,
              orderId: newOrderId!,
              productVariantId: cartItem.productVariantId,
              quantity: cartItem.quantity,
              priceAtPurchase: dbVariant.price,
            };
          }),
        );
      } catch (error) {
        console.error("Failed to create pending order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order.",
        });
      }

      // 4. Create the Stripe session
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: lineItems,
          customer_email: ctx.session?.user?.email ?? undefined,
          shipping_address_collection: {
            allowed_countries: ["US", "CA", "GB"],
          },
          billing_address_collection: "required",
          success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/payment/cancel`,
          metadata: {
            userId: ctx.session?.user?.id ?? "guest",
            orderId: newOrderId,
          },
        });
        return { url: session.url };
      } catch (error) {
        console.error("Failed to create Stripe session:", error);
        await ctx.db
          .update(orders)
          .set({ status: "cancelled" })
          .where(eq(orders.id, newOrderId));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payment session.",
        });
      }
    }),
});
