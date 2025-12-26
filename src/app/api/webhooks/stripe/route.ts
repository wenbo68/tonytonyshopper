import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "~/env.js";
import { db } from "~/server/db";
import {
  orders,
  orderItems,
  productVariants,
  cartItems,
} from "~/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Stripe } from "stripe";
import type { OrderStatusReason } from "~/type";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  // event from webhook a/f user clicks pay in checkout
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return new NextResponse(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}`,
      { status: 400 },
    );
  }

  // ==== handle based on event type ====

  // Handle expiration (user spent too long to pay)
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await db
        .update(orders)
        .set({
          status: "abandoned",
          statusReason: "abandoned_stripe_expired",
        })
        .where(eq(orders.id, orderId));
    }
  }

  // Handle payment failure (Card declined)
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      await db
        .update(orders)
        .set({
          status: "abandoned",
          statusReason: "abandoned_payment_failed",
        })
        .where(eq(orders.id, orderId));
    }
  }

  // Handle payment successful (payment went thru, so errors here need refund)
  if (event.type === "checkout.session.completed") {
    const sessionData = event.data.object as Stripe.Checkout.Session;
    const userId = sessionData.metadata?.userId; // We need this for the cart update
    const orderId = sessionData.metadata?.orderId;
    if (!orderId) {
      return new NextResponse("No orderId in metadata", { status: 400 });
    }

    try {
      // 1. Retrieve the FULL session with expansions (to get card info, shipping, etc.)
      const session = await stripe.checkout.sessions.retrieve(sessionData.id, {
        expand: [
          "payment_intent.payment_method",
          "total_details",
          "shipping_cost.shipping_rate",
        ],
      });

      // three db writes: deduct stock, update order, clear cart
      await db.transaction(async (tx) => {
        // 2. Deduct stock (Atomic)
        const itemsInOrder = await tx.query.orderItems.findMany({
          where: eq(orderItems.orderId, orderId),
        });
        for (const item of itemsInOrder) {
          const updateResult = await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
            .where(
              and(
                eq(productVariants.id, item.productVariantId),
                sql`${productVariants.stock} >= ${item.quantity}`,
              ),
            )
            .returning();
          // If no rows updated, stock was insufficient
          if (updateResult.length === 0) {
            // Throw a specific error format we can parse later: "OUT_OF_STOCK:variant_id"
            throw new Error(`OUT_OF_STOCK:${item.productVariantId}`);
          }
        }

        // 3. Update order status to paid and insert additional info
        const taxAmount = (session.total_details?.amount_tax ?? 0) / 100;
        const shippingAmount =
          (session.total_details?.amount_shipping ?? 0) / 100;
        const grandTotal = (session.amount_total ?? 0) / 100;

        const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
        const paymentMethod =
          paymentIntent.payment_method as Stripe.PaymentMethod;
        const card = paymentMethod?.card;

        const shippingRate = session.shipping_cost
          ?.shipping_rate as Stripe.ShippingRate;
        const shippingDetails = session.collected_information?.shipping_details;
        const billingDetails = paymentMethod.billing_details;

        await tx
          .update(orders)
          .set({
            status: "paid",
            tax: taxAmount.toFixed(2),
            shippingFee: shippingAmount.toFixed(2),
            totalAmount: grandTotal.toFixed(2),
            paymentIntentId: paymentIntent.id,
            cardBrand: card?.brand ?? null,
            cardLast4: card?.last4 ?? null,
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
          .where(eq(orders.id, orderId));

        // 4. Clear user cart if applicable
        if (userId && userId !== "guest") {
          await tx.delete(cartItems).where(eq(cartItems.userId, userId));
        }
      });
    } catch (error) {
      console.error("Fulfillment failed:", error);

      let statusReason: OrderStatusReason = "abandoned_code_error";

      // 3. Handle Out Of Stock Logic
      if (error instanceof Error && error.message.startsWith("OUT_OF_STOCK")) {
        statusReason = "abandoned_out_of_stock";

        // Extract the ID from the error message we threw above
        const outOfStockItemVariantId = error.message.split(":")[1];

        // IMPORTANT: We run this OUTSIDE the transaction.
        // The transaction above rolled back, so the cart is still full.
        // We now deliberately set the bad item to 0.
        if (userId && userId !== "guest" && outOfStockItemVariantId) {
          await db
            .update(cartItems)
            .set({ quantity: 0 })
            .where(
              and(
                eq(cartItems.userId, userId),
                eq(cartItems.productVariantId, outOfStockItemVariantId),
              ),
            );
        }
      }

      // Mark order as abandoned
      await db
        .update(orders)
        .set({ status: "abandoned", statusReason: statusReason })
        .where(eq(orders.id, orderId));
    }
  }

  return new NextResponse(null, { status: 200 });
}
