// Path: ~/server/api/routers/product.ts
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure, // Use your new admin procedure
} from "~/server/api/trpc";
import {
  products,
  productsToCategories,
  productVariants,
  categories, // Import categories
} from "~/server/db/schema";

// Zod schema for a single variant
const variantSchema = z.object({
  name: z.string().min(1), // e.g., "Red / Medium"
  price: z.number().min(0.01),
  stock: z.number().int().min(0),
  images: z.string().url().array().optional(),
  options: z.record(z.string()), // { "color": "Red", "size": "Medium" }
});

export const adminRouter = createTRPCRouter({
  /**
   * Add a new product (Admin Only)
   */
  add: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        videoUrls: z.string().url().array().optional(),
        categoryIds: z.string().array().min(1),
        variants: z.array(variantSchema).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, description, videoUrls, categoryIds, variants } = input;

      // Use a transaction to ensure all or nothing is created
      const newProduct = await ctx.db.transaction(async (tx) => {
        // 1. Create the parent product
        const [createdProduct] = await tx
          .insert(products)
          .values({
            name,
            description,
            videos: videoUrls,
          })
          .returning({ id: products.id });

        if (!createdProduct?.id) {
          tx.rollback();
          throw new Error("Failed to create product.");
        }
        const newProductId = createdProduct.id;

        // 2. Link categories to the product
        await tx.insert(productsToCategories).values(
          categoryIds.map((catId) => ({
            productId: newProductId,
            categoryId: catId,
          })),
        );

        // 3. Create all the variants
        await tx.insert(productVariants).values(
          variants.map((variant) => ({
            productId: newProductId,
            name: variant.name,
            price: variant.price.toString(), // Convert number to string for 'numeric'
            stock: variant.stock,
            images: variant.images,
            options: variant.options,
          })),
        );

        return { id: newProductId };
      });

      return newProduct;
    }),
});
