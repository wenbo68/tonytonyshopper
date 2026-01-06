import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { fetchOrderItem, updateOrderItem } from "~/server/utils/order";
import {
  mediaTypeConst,
  rejectReturnReasonConst,
  returnReasonConst,
  returnReasonDetailsMap,
} from "~/const";
import { TRPCError } from "@trpc/server";
// import { returnLabels } from "~/server/db/schema";
// import { eq } from "drizzle-orm";
// import { orderItems } from "~/server/db/schema";
import Stripe from "stripe";
import { env } from "~/env";
import { returnMedia } from "~/server/db/schema";

export const orderItemRouter = createTRPCRouter({
  // paid -> canceled
  cancelOrderItem: protectedProcedure
    .input(
      z.object({
        orderItemId: z.string(),
        quantity: z.number().min(1, "Invalid quantity."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { orderItemId, quantity } = input;
      await ctx.db.transaction(async (tx) => {
        await updateOrderItem(
          tx,
          ctx.session.user.id,
          orderItemId,
          "paid",
          "canceled",
          quantity,
          {},
        );
      });
    }),

  // paid -> shipped
  updateOrderItemShipment: adminProcedure
    .input(
      z.object({
        orderItemId: z.string(),
        quantity: z.number().min(1, "Invalid quantity."),
        carrier: z.string().min(1, "Invalid carrier."),
        trackingNumber: z.string().min(1, "Invalid tracking number."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { orderItemId, quantity, carrier, trackingNumber } = input;
      await ctx.db.transaction(async (tx) => {
        await updateOrderItem(
          tx,
          undefined,
          orderItemId,
          "paid",
          "shipped",
          quantity,
          { carrier, trackingNumber },
        );
      });
    }),

  // shipped -> paid
  cancelOrderItemShipment: adminProcedure
    .input(
      z.object({
        orderItemId: z.string(),
        quantity: z.number().min(1, "Invalid quantity."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { orderItemId, quantity } = input;
      await ctx.db.transaction(async (tx) => {
        await updateOrderItem(
          tx,
          undefined,
          orderItemId,
          "shipped",
          "paid",
          quantity,
          {},
        );
      });
    }),

  // shipped -> return_requested
  requestOrderItemReturn: protectedProcedure
    .input(
      z.object({
        orderItemId: z.string(),
        quantity: z.number().min(1, "Invalid quantity."),
        returnReason: z.enum(returnReasonConst),
        media: z
          .array(
            z.object({
              key: z.string(),
              url: z.string(),
              type: z.enum(mediaTypeConst),
              position: z.number(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { orderItemId, quantity, returnReason, media } = input;
      await ctx.db.transaction(async (tx) => {
        await updateOrderItem(
          tx,
          ctx.session.user.id,
          orderItemId,
          "shipped",
          "return_requested",
          quantity,
          { returnReason },
        );
        // 2. Insert Media
        if (media && media.length > 0) {
          await tx.insert(returnMedia).values(
            media.map((m) => ({
              orderItemId,
              type: m.type,
              url: m.url,
              key: m.key,
              position: m.position,
            })),
          );
        }
      });
    }),

  // return_requested -> return_rejected
  rejectOrderItemReturn: adminProcedure
    .input(
      z.object({
        orderItemId: z.string(),
        quantity: z.number().min(1, "Invalid quantity."),
        rejectReturnReason: z.enum(rejectReturnReasonConst),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { orderItemId, quantity, rejectReturnReason } = input;
      await ctx.db.transaction(async (tx) => {
        await updateOrderItem(
          tx,
          undefined,
          orderItemId,
          "return_requested",
          "return_rejected",
          quantity,
          { rejectReturnReason },
        );
      });
    }),

  // // return_requested -> label_quoted
  // // in frontend, determine if label is paid by admin/user using order item return reason
  // quoteReturnLabel: protectedProcedure
  //   .input(
  //     z.object({
  //       orderItemId: z.string(),
  //       quantity: z.number().min(1, "Invalid quantity."),
  //       quote: z.number().min(0, "Invalid quote."),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     await ctx.db.transaction(async (tx) => {
  //       // create label
  //       const [returnLabel] = await tx
  //         .insert(returnLabels)
  //         .values({
  //           cost: input.quote.toString(),
  //         })
  //         .returning({ id: returnLabels.id });

  //       if (!returnLabel) {
  //         throw new TRPCError({
  //           code: "INTERNAL_SERVER_ERROR",
  //           message: "Failed to create return label.",
  //         });
  //       }

  //       //update order item
  //       await await updateOrderItem(
  //         tx,
  //         ctx.session.user.id,
  //         input.orderItemId,
  //         "return_requested",
  //         "label_quoted",
  //         input.quantity,
  //         { returnLabelId: returnLabel.id },
  //       );
  //     });
  //   }),

  // // label_quoted -> label_rejected/label_confirmed
  // confirmLabelQuote: protectedProcedure
  //   .input(
  //     z.object({
  //       orderItemId: z.string(),
  //       quantity: z.number().min(1, "Invalid quantity."),
  //       confirm: z.boolean(),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     await ctx.db.transaction(async (tx) => {
  //       if (input.confirm) {
  //         await await updateOrderItem(
  //           tx,
  //           ctx.session.user.id,
  //           input.orderItemId,
  //           "label_quoted",
  //           "label_confirmed",
  //           input.quantity,
  //           {},
  //         );
  //       } else {
  //         await await updateOrderItem(
  //           tx,
  //           ctx.session.user.id,
  //           input.orderItemId,
  //           "label_quoted",
  //           "label_rejected",
  //           input.quantity,
  //           {},
  //         );
  //       }
  //     });
  //   }),

  // // label_confirmed -> label_generated
  // generateReturnLabel: protectedProcedure
  //   .input(
  //     z.object({
  //       orderItemId: z.string(),
  //       quantity: z.number().min(1, "Invalid quantity."),
  //       labelUrl: z.string().min(1, "Invalid return label."),
  //       carrier: z.string().optional(),
  //       trackingNumber: z.string().optional(),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const { orderItemId, quantity, labelUrl, carrier, trackingNumber } =
  //       input;

  //     await ctx.db.transaction(async (tx) => {
  //       // find label of order item
  //       //
  //       await await updateOrderItem(
  //         tx,
  //         ctx.session.user.id,
  //         orderItemId,
  //         "label_confirmed",
  //         "label_generated",
  //         quantity,
  //         { returnLabelId: label.id },
  //       );
  //     });
  //   }),

  // return_requested -> return_approved
  approveOrdetItemReturn: adminProcedure
    .input(
      z.object({
        orderItemId: z.string(),
        quantity: z.number().min(1, "Invalid quantity"),
        returnCost: z.number().min(0, "Invalid cost"),
        returnLabel: z.string().min(1, "Invalid label"),
        returnCarrier: z.string().min(1, "Invalid carrier"),
        returnTrackingNumber: z.string().min(1, "Invalid tracking number"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        orderItemId,
        quantity,
        returnCost,
        returnLabel,
        returnCarrier,
        returnTrackingNumber,
      } = input;
      await ctx.db.transaction(async (tx) => {
        await updateOrderItem(
          tx,
          undefined,
          orderItemId,
          "return_requested",
          "return_approved",
          quantity,
          {
            returnCost: returnCost.toString(),
            returnLabel,
            returnCarrier,
            returnTrackingNumber,
          },
        );
      });
    }),

  // return_approved -> returned
  returnOrderItem: protectedProcedure
    .input(
      z.object({
        orderItemId: z.string(),
        quantity: z.number().min(1, "Invalid quantity"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { orderItemId, quantity } = input;
      await ctx.db.transaction(async (tx) => {
        await updateOrderItem(
          tx,
          ctx.session.user.id,
          orderItemId,
          "return_approved",
          "returned",
          quantity,
          {},
        );
      });
    }),

  // returned -> refunded
  refundOrderItem: adminProcedure
    .input(
      z.object({
        orderItemId: z.string(),
        quantity: z.number().min(1, "Invalid quantity"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { orderItemId, quantity } = input;

      await ctx.db.transaction(async (tx) => {
        // 1. Fetch item and order details for calculation
        const item = await fetchOrderItem(
          tx,
          undefined,
          orderItemId,
          "returned",
          quantity,
        );

        if (!item.returnReason) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order item has no returnReason.",
          });
        }

        const { userPaysShipping } = returnReasonDetailsMap[item.returnReason];

        // Calculate proportional tax: (Item Price * Quantity) * (Total Tax / Total Subtotal)
        const refundSubtotal = parseFloat(item.priceAtPurchase) * quantity;
        const taxRate =
          parseFloat(item.order.tax) / parseFloat(item.order.subtotal);
        const refundTax = refundSubtotal * taxRate;

        const returnCost = userPaysShipping
          ? parseFloat(item.returnCost ?? "0")
          : 0;

        // Final amount in cents for Stripe (Stripe requires integers)
        const refundTotalCents = Math.round(
          (refundSubtotal + refundTax - returnCost) * 100,
        );

        // 3. Process Stripe Refund if amount > 0
        if (refundTotalCents > 0) {
          if (!item.order.paymentIntentId) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Order item has no paymentIntentId.",
            });
          }

          const stripe = new Stripe(env.STRIPE_SECRET_KEY);
          try {
            await stripe.refunds.create({
              payment_intent: item.order.paymentIntentId,
              amount: refundTotalCents,
            });
          } catch (error) {
            console.error("Stripe Refund Error:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Refund failed: Stripe error",
            });
          }
        } else {
          // // "if the refund becomes 0 or less, do not refund."
          // throw new TRPCError({
          //   code: "BAD_REQUEST",
          //   message:
          //     "Refund amount is 0 or less after deducting return shipping costs.",
          // });
        }

        // 4. Update Database Status
        await updateOrderItem(
          tx,
          ctx.session.user.id,
          item,
          "returned",
          "refunded",
          quantity,
          { refundedAmount: (refundTotalCents / 100).toString() },
        );
      });
    }),
});
