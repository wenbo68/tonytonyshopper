import { z } from "zod";
import {
  createTRPCRouter,
  // protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  // cartItems,
  orderItems,
  orders,
  productVariants,
} from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { Stripe } from "stripe";
import { env } from "~/env.js";
import { TRPCError } from "@trpc/server";
import { v4 } from "uuid";
import { formatProductOptionsCaption } from "~/server/utils/product";

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
    .mutation(async ({ ctx, input: inputProps }) => {
      // if (input.length === 0) {
      //   throw new TRPCError({
      //     code: "BAD_REQUEST",
      //     message: "Cart is empty.",
      //   });
      // }

      // Filter out items with quantity 0
      const input = inputProps.filter((item) => item.quantity > 0);
      if (input.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cart is empty.",
        });
      }

      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      const baseUrl = getBaseUrl();

      // 1. mark all prev pending orders of this user as abandoned voluntarily
      if (ctx.session?.user) {
        await ctx.db
          .update(orders)
          .set({ status: "abandoned", statusReason: "abandoned_voluntary" })
          .where(
            and(
              eq(orders.userId, ctx.session.user.id),
              eq(orders.status, "pending"),
            ),
          );
      }

      // 2. one db query: fetch item info for all cart items
      const cartItemsInfo = await ctx.db.query.productVariants.findMany({
        where: inArray(
          productVariants.id,
          input.map((item) => item.productVariantId),
        ),
        with: {
          product: {
            columns: { name: true },
          },
        },
      });

      // 3. create line items obj -> needed for stripe session
      let totalCost = 0;
      const lineItems = input.map((variantIdAndQty) => {
        const cartItemInfo = cartItemsInfo.find(
          (v) => v.id === variantIdAndQty.productVariantId,
        );

        if (!cartItemInfo) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Variant id (${variantIdAndQty.productVariantId}) does not exist.`,
          });
        }
        if (cartItemInfo.stock < variantIdAndQty.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${cartItemInfo.product.name} (${formatProductOptionsCaption(cartItemInfo.options)}) only has ${cartItemInfo.stock} left.`,
          });
        }

        const itemPrice = Math.round(parseFloat(cartItemInfo.price) * 100);
        totalCost += itemPrice * variantIdAndQty.quantity;

        // Might not want to change the format here (stripe session might require specific namings)
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${cartItemInfo.product.name} ${formatProductOptionsCaption(cartItemInfo.options) ?? ""}`.trim(),
            },
            unit_amount: itemPrice,
          },
          quantity: variantIdAndQty.quantity,
        };
      });

      // 4. two db writes: insert pending order + insert order items
      let newOrderId: string;
      try {
        const orderId = v4();
        await ctx.db.insert(orders).values({
          id: orderId,
          userId: ctx.session?.user?.id ?? null,
          subtotal: (totalCost / 100).toFixed(2),
          status: "pending",
        });

        await ctx.db.insert(orderItems).values(
          input.map((item) => {
            const variant = cartItemsInfo.find(
              (v) => v.id === item.productVariantId,
            )!;
            return {
              id: v4(),
              orderId: orderId,
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              priceAtPurchase: variant.price,
            };
          }),
        );
        newOrderId = orderId;
      } catch (err) {
        console.error("Order creation failed:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initialize order.",
        });
      }

      // 5. create/return the stripe session
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: lineItems,
          customer_email: ctx.session?.user?.email ?? undefined,
          automatic_tax: { enabled: true },
          shipping_options: [
            { shipping_rate: "shr_1ShS9nK2sO6ATVfVKbsWCKK9" }, // Standard Shipping
            { shipping_rate: "shr_1ShSAIK2sO6ATVfV320VDOdm" }, // Express Shipping
          ],
          shipping_address_collection: {
            allowed_countries: ["US", "CA", "GB"],
          },
          billing_address_collection: "required",
          // Pass metadata so the webhook knows which DB rows to update!
          metadata: {
            userId: ctx.session?.user?.id ?? "guest",
            orderId: newOrderId,
          },
          // success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          // cancel_url: `${baseUrl}/payment/cancel`,
          success_url: `${baseUrl}/search?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/cart?canceled=true`,
        });
        return { url: session.url };
      } catch (error) {
        // If Stripe fails, we mark the DB order as failed due to gateway error
        await ctx.db
          .update(orders)
          .set({ status: "abandoned", statusReason: "abandoned_code_error" })
          .where(eq(orders.id, newOrderId));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe session creation failed.",
        });
      }
    }),
});
