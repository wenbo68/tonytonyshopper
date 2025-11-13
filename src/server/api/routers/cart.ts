// Path: ~/server/api/routers/cart.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { cartItems } from "~/server/db/schema"; //
import { eq, and } from "drizzle-orm";

export const cartRouter = createTRPCRouter({
  /**
   * Get all items in the user's cart.
   * Joins with variants and products to get full details.
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const userCart = await ctx.db.query.cartItems.findMany({
      where: eq(cartItems.userId, ctx.session.user.id),
      with: {
        // Updated Relation: cartItem -> productVariant -> product
        productVariant: {
          with: {
            product: true, // Get the parent product's details (name, desc)
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
        quantity: z.number().min(1),
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
          // CHANGED: from productId to productVariantId
          productVariantId: z.string(),
          quantity: z.number(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      for (const item of input) {
        const existingItem = await ctx.db.query.cartItems.findFirst({
          where: and(
            eq(cartItems.userId, ctx.session.user.id),
            // CHANGED: from productId to productVariantId
            eq(cartItems.productVariantId, item.productVariantId), //
          ),
        });

        if (existingItem) {
          await ctx.db
            .update(cartItems)
            .set({ quantity: existingItem.quantity + item.quantity })
            .where(
              and(
                eq(cartItems.userId, ctx.session.user.id),
                // CHANGED: from productId to productVariantId
                eq(cartItems.productVariantId, item.productVariantId), //
              ),
            );
        } else {
          await ctx.db.insert(cartItems).values({
            userId: ctx.session.user.id,
            // CHANGED: from productId to productVariantId
            productVariantId: item.productVariantId, //
            quantity: item.quantity,
          });
        }
      }
      return { success: true };
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

      if (quantity <= 0) {
        // Remove item
        await ctx.db.delete(cartItems).where(
          and(
            eq(cartItems.userId, userId),
            // CHANGED: from productId to productVariantId
            eq(cartItems.productVariantId, productVariantId), //
          ),
        );
      } else {
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
      }
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
