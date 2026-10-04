// Path: ~/server/api/routers/cart.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { cartItems, productVariants } from "~/server/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export const cartRouter = createTRPCRouter({
  /**
   * Get all items in the user's cart.
   * Joins with variants and products to get full details.
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const userCart = await ctx.db.query.cartItems.findMany({
      where: eq(cartItems.userId, ctx.session.user.id),
      orderBy: [desc(cartItems.createdAt)],
      with: {
        productVariant: {
          with: {
            media: true,
            product: true,
            // product: {
            //   with: {
            //     variants: true, // <--- CHANGED: Fetch all variants to populate the Edit Modal instantly
            //   },
            // },
          },
        },
      },
    });
    return userCart;
  }),

  /**
   * Add a specific variant to the user's cart.
   * If the variant already exists, its quantity is incremented.
   */
  add: protectedProcedure
    .input(
      z.object({
        // CHANGED: from productId to productVariantId
        productVariantId: z.string(),
        quantity: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { productVariantId, quantity } = input; //

      // Check if item already exists
      const existingItem = await ctx.db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.userId, userId),
          // CHANGED: from productId to productVariantId
          eq(cartItems.productVariantId, productVariantId), //
        ),
      });

      if (existingItem) {
        // Update quantity
        await ctx.db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + quantity })
          .where(
            and(
              eq(cartItems.userId, userId),
              // CHANGED: from productId to productVariantId
              eq(cartItems.productVariantId, productVariantId), //
            ),
          );
      } else {
        // Insert new item
        await ctx.db.insert(cartItems).values({
          userId,
          // CHANGED: from productId to productVariantId
          productVariantId, //
          quantity,
        });
      }
      return { success: true };
    }),

  /**
   * Merge guest cart (from localStorage) with DB cart on login.
   */
  merge: protectedProcedure
    .input(
      z.array(
        z.object({
          productVariantId: z.string(),
          quantity: z.number(),
          createdAt: z.number().optional(), // <-- 1. Accept the timestamp
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const requestedIds = [...new Set(input.map((i) => i.productVariantId))];
      if (requestedIds.length === 0) return { merged: 0, skipped: [] };

      // A guest cart lives in the browser, so it can point at variants that
      // were deleted since. Skip those instead of failing the whole merge.
      const existing = await ctx.db
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(inArray(productVariants.id, requestedIds));
      const existingIds = new Set(existing.map((v) => v.id));
      const validItems = input.filter((i) =>
        existingIds.has(i.productVariantId),
      );
      const skipped = requestedIds.filter((id) => !existingIds.has(id));

      await ctx.db.transaction(async (tx) => {
        for (const item of validItems) {
          const existingItem = await tx.query.cartItems.findFirst({
            where: and(
              eq(cartItems.userId, userId),
              eq(cartItems.productVariantId, item.productVariantId),
            ),
          });

          if (existingItem) {
            // Keep the original DB timestamp; just add the quantities together.
            await tx
              .update(cartItems)
              .set({ quantity: existingItem.quantity + item.quantity })
              .where(
                and(
                  eq(cartItems.userId, userId),
                  eq(cartItems.productVariantId, item.productVariantId),
                ),
              );
          } else {
            await tx.insert(cartItems).values({
              userId,
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            });
          }
        }
      });

      return { merged: validItems.length, skipped };
    }),

  /**
   * Remove an item from the cart.
   */
  remove: protectedProcedure
    .input(z.object({ productVariantId: z.string() })) // CHANGED
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(cartItems).where(
        and(
          eq(cartItems.userId, ctx.session.user.id),
          // CHANGED: from productId to productVariantId
          eq(cartItems.productVariantId, input.productVariantId), //
        ),
      );
      return { success: true };
    }),

  /**
   * Update the quantity of an item in the user's cart.
   */
  updateQuantity: protectedProcedure
    .input(
      z.object({
        // CHANGED: from productId to productVariantId
        productVariantId: z.string(),
        quantity: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { productVariantId, quantity } = input;

      // if (quantity <= 0) {
      //   // Remove item
      //   await ctx.db.delete(cartItems).where(
      //     and(
      //       eq(cartItems.userId, userId),
      //       // CHANGED: from productId to productVariantId
      //       eq(cartItems.productVariantId, productVariantId), //
      //     ),
      //   );
      // } else {

      // Update quantity
      await ctx.db
        .update(cartItems)
        .set({ quantity: quantity })
        .where(
          and(
            eq(cartItems.userId, userId),
            // CHANGED: from productId to productVariantId
            eq(cartItems.productVariantId, productVariantId), //
          ),
        );

      // }
      return { success: true };
    }),

  // --- NEW PROCEDURE ---
  /**
   * Updates an item in the cart.
   * Can change the variant OR the quantity.
   */
  updateItem: protectedProcedure
    .input(
      z.object({
        oldProductVariantId: z.string(),
        newProductVariantId: z.string(),
        newQuantity: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { oldProductVariantId, newProductVariantId, newQuantity } = input;
      const userId = ctx.session.user.id;

      // If the variant hasn't changed, just update the quantity.
      if (oldProductVariantId === newProductVariantId) {
        await ctx.db
          .update(cartItems)
          .set({ quantity: newQuantity })
          .where(
            and(
              eq(cartItems.userId, userId),
              eq(cartItems.productVariantId, newProductVariantId),
            ),
          );
        return { success: true };
      }

      // --- Variant HAS changed. This is a transaction. ---
      await ctx.db.transaction(async (tx) => {
        // 1. Remove the old item
        await tx
          .delete(cartItems)
          .where(
            and(
              eq(cartItems.userId, userId),
              eq(cartItems.productVariantId, oldProductVariantId),
            ),
          );

        // 2. Check if the *new* variant already exists in the cart
        const existingNewItem = await tx.query.cartItems.findFirst({
          where: and(
            eq(cartItems.userId, userId),
            eq(cartItems.productVariantId, newProductVariantId),
          ),
        });

        if (existingNewItem) {
          // 3a. It exists: update its quantity
          await tx
            .update(cartItems)
            .set({
              quantity: existingNewItem.quantity + newQuantity,
            })
            .where(
              and(
                eq(cartItems.userId, userId),
                eq(cartItems.productVariantId, newProductVariantId),
              ),
            );
        } else {
          // 3b. It's new: insert it
          await tx.insert(cartItems).values({
            userId,
            productVariantId: newProductVariantId,
            quantity: newQuantity,
          });
        }
      });

      return { success: true };
    }),
});
