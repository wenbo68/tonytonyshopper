// Path: ~/server/api/routers/cart.ts
import { z } from "zod";
// --- 1. ADD THESE IMPORTS ---
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
} from "~/server/db/schema"; //
import { eq, and, inArray } from "drizzle-orm";
import { Stripe } from "stripe";
import { env } from "~/env.js";
import { TRPCError } from "@trpc/server";
import { v4 } from "uuid"; // You'll need to install uuid: pnpm add uuid

// --- 2. ADD A HELPER TO GET THE BASE URL ---
// We need this to tell Stripe where to redirect users on success/failure
function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

// ... (imports)

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

      // 3. --- NEW: Create a 'pending' order in our database ---
      let newOrderId: string | null = null;
      try {
        const [newOrder] = await ctx.db
          .insert(orders)
          .values({
            id: `order_${v4()}`, // Generate a unique order ID
            userId: ctx.session?.user?.id,
            guestEmail: ctx.session?.user?.email, // Use email for guest, or user email
            totalAmount: (totalAmount / 100).toFixed(2), // Store as dollars
            status: "pending",
            // We'll get addresses from Stripe later via webhook or success page
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
              id: `item_${v4()}`, // Generate a unique item ID
              orderId: newOrderId!,
              productVariantId: cartItem.productVariantId,
              quantity: cartItem.quantity,
              priceAtPurchase: dbVariant.price, // Store the price at this moment
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

          // --- ADD THESE LINES ---
          shipping_address_collection: {
            allowed_countries: ["US", "CA", "GB"], // Add any countries you ship to
          },
          billing_address_collection: "required", // Collect billing address
          // --- END OF ADDED LINES ---

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
        // --- NEW: If Stripe fails, cancel the order we just made ---
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
