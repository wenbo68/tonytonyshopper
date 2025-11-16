// Path: ~/server/api/routers/product.ts
import { and, eq, inArray } from "drizzle-orm";
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

// --- NEW: Zod schema for an UPDATED variant (has an optional ID) ---
const updateVariantSchema = variantSchema.extend({
  id: z.string().optional(),
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

  // --- ADD THIS NEW 'update' MUTATION ---
  /**
   * Update an existing product (Admin Only)
   */
  update: adminProcedure
    .input(
      z.object({
        productId: z.string(), // ID of the product to update
        name: z.string().min(1),
        description: z.string().optional(),
        videoUrls: z.string().url().array().optional(),
        categoryIds: z.string().array().min(1),
        variants: z.array(updateVariantSchema).min(1), // Use the new schema
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, name, description, videoUrls, categoryIds, variants } =
        input;

      await ctx.db.transaction(async (tx) => {
        // 1. Update the parent product
        await tx
          .update(products)
          .set({
            name,
            description,
            videos: videoUrls,
            // You might want an 'updatedAt' field here
          })
          .where(eq(products.id, productId));

        // 2. Update categories (simple approach: delete all, then re-add)
        await tx
          .delete(productsToCategories)
          .where(eq(productsToCategories.productId, productId));

        await tx.insert(productsToCategories).values(
          categoryIds.map((catId) => ({
            productId: productId,
            categoryId: catId,
          })),
        );

        // 3. Update Variants (the complex part)
        const variantsToUpdate = variants.filter((v) => !!v.id);
        const variantsToCreate = variants.filter((v) => !v.id);
        const incomingVariantIds = variantsToUpdate.map((v) => v.id!);

        // 3a. Find variants to delete
        const currentVariants = await tx.query.productVariants.findMany({
          where: eq(productVariants.productId, productId),
          columns: { id: true },
        });
        const currentVariantIds = currentVariants.map((v) => v.id);

        const variantIdsToDelete = currentVariantIds.filter(
          (id) => !incomingVariantIds.includes(id),
        );

        if (variantIdsToDelete.length > 0) {
          await tx
            .delete(productVariants)
            .where(
              and(
                eq(productVariants.productId, productId),
                inArray(productVariants.id, variantIdsToDelete),
              ),
            );
        }

        // 3b. Update existing variants
        if (variantsToUpdate.length > 0) {
          await Promise.all(
            variantsToUpdate.map((variant) =>
              tx
                .update(productVariants)
                .set({
                  name: variant.name,
                  price: variant.price.toString(),
                  stock: variant.stock,
                  images: variant.images,
                  options: variant.options,
                })
                .where(eq(productVariants.id, variant.id!)),
            ),
          );
        }

        // 3c. Create new variants
        if (variantsToCreate.length > 0) {
          await tx.insert(productVariants).values(
            variantsToCreate.map((variant) => ({
              productId: productId,
              name: variant.name,
              price: variant.price.toString(),
              stock: variant.stock,
              images: variant.images,
              options: variant.options,
            })),
          );
        }
      });

      return { id: productId };
    }),
});
