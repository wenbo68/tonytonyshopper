import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import {
  orderItems,
  orders,
  products,
  productsToCategories,
  productVariants,
  users,
  variantMedia,
} from "~/server/db/schema";
import { updateProductVariantDenorms } from "~/server/utils/product";
// import { Resend } from "resend";
import {
  addProductInputSchema,
  getAdminOrdersInputSchema,
  updateProductInputSchema,
} from "~/type";
// import { TRPCError } from "@trpc/server";
import { getOrderItemStatusPriority } from "~/server/utils/order";
import { UTApi } from "uploadthing/server";
import { TRPCError } from "@trpc/server";

// Initialize UTApi (automatically uses UPLOADTHING_TOKEN from env)
const utapi = new UTApi();

export const adminRouter = createTRPCRouter({
  /**
   * Delete a file from UploadThing by its key.
   */
  deleteMedia: adminProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      // Delete the file from UploadThing
      const success = await utapi.deleteFiles(input.key);
      return { success };
    }),

  addProduct: adminProcedure
    .input(addProductInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, description, categoryIds, variants } = input;

      // Use a transaction to ensure all or nothing is created
      const newProduct = await ctx.db.transaction(async (tx) => {
        // 1. Create the parent product
        const [createdProduct] = await tx
          .insert(products)
          .values({
            name,
            description,
          })
          .returning({ id: products.id });

        if (!createdProduct?.id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create product.",
          });
        }
        const newProductId = createdProduct.id;

        // 2. Link categories to the product
        if (categoryIds.length > 0) {
          await tx.insert(productsToCategories).values(
            categoryIds.map((catId) => ({
              productId: newProductId,
              categoryId: catId,
            })),
          );
        }

        // 3. Create all the variants and capture their IDs
        const createdVariants = await tx
          .insert(productVariants)
          .values(
            variants.map((variant) => ({
              productId: newProductId,
              price: variant.price.toString(),
              stock: variant.stock,
              options: variant.options,
            })),
          )
          .returning({ id: productVariants.id });

        // 4. Batch Insert media [UPDATED]
        // We now process 'images' and 'videos' separately and merge them
        const allMediaToInsert = variants.flatMap((variant, i) => {
          const variantId = createdVariants[i]?.id;
          if (!variantId) return [];

          const mediaEntries = [];

          console.log("variant images: ", variant.images.length); //undefined
          console.log("variant videos: ", variant.videos.length); //undefined

          // Process Images (Type: "image", Position: index in images array)
          if (variant.images.length > 0) {
            mediaEntries.push(
              ...variant.images.map((img, index) => ({
                variantId,
                type: "image" as const,
                url: img.url,
                key: img.key,
                position: index,
              })),
            );
          }

          // Process Videos (Type: "video", Position: index in videos array)
          if (variant.videos.length > 0) {
            mediaEntries.push(
              ...variant.videos.map((vid, index) => ({
                variantId,
                type: "video" as const,
                url: vid.url,
                key: vid.key,
                position: index,
              })),
            );
          }

          console.log("mediaEntries: ", mediaEntries.length); // 0 for all variants
          return mediaEntries;
        });

        if (allMediaToInsert.length > 0) {
          await tx.insert(variantMedia).values(allMediaToInsert);
        }

        // 5. Update denormalized fields
        await updateProductVariantDenorms(tx, newProductId);

        return { id: newProductId };
      });

      return newProduct;
    }),

  /**
   * Update an existing product (Admin Only)
   */
  updateProduct: adminProcedure
    .input(updateProductInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { productId, name, description, categoryIds, variants } = input;

      await ctx.db.transaction(async (tx) => {
        // 1. Update the parent product
        await tx
          .update(products)
          .set({
            name,
            description,
            updatedAt: new Date(),
          })
          .where(eq(products.id, productId));

        // 2. Update categories (delete all, then re-add)
        await tx
          .delete(productsToCategories)
          .where(eq(productsToCategories.productId, productId));

        if (categoryIds.length > 0) {
          await tx.insert(productsToCategories).values(
            categoryIds.map((catId) => ({
              productId: productId,
              categoryId: catId,
            })),
          );
        }

        // 3. Update Variants
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
          // Cascading delete will handle variantMedia
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
                  price: variant.price.toString(),
                  stock: variant.stock,
                  options: variant.options,
                })
                .where(eq(productVariants.id, variant.id!)),
            ),
          );

          // Delete existing media for updated variants (we will re-insert them fresh)
          await tx
            .delete(variantMedia)
            .where(inArray(variantMedia.variantId, incomingVariantIds));
        }

        // 3c. Create new variants
        let newVariantIds: string[] = [];
        if (variantsToCreate.length > 0) {
          const created = await tx
            .insert(productVariants)
            .values(
              variantsToCreate.map((variant) => ({
                productId: productId,
                price: variant.price.toString(),
                stock: variant.stock,
                options: variant.options,
              })),
            )
            .returning({ id: productVariants.id });
          newVariantIds = created.map((v) => v.id);
        }

        // 4. Update Media: Combine updated and created variants
        // Map inputs to their target DB IDs (existing IDs for updates, new IDs for creates)
        const allVariantsToProcess = [
          ...variantsToUpdate.map((v) => ({ ...v, targetId: v.id! })),
          ...variantsToCreate.map((v, i) => ({
            ...v,
            targetId: newVariantIds[i]!,
          })),
        ];

        const mediaEntries = [];

        for (const variant of allVariantsToProcess) {
          // Images
          if (variant.images?.length) {
            mediaEntries.push(
              ...variant.images.map((img, index) => ({
                variantId: variant.targetId,
                type: "image" as const,
                url: img.url,
                key: img.key,
                position: index,
              })),
            );
          }
          // Videos
          if (variant.videos?.length) {
            mediaEntries.push(
              ...variant.videos.map((vid, index) => ({
                variantId: variant.targetId,
                type: "video" as const,
                url: vid.url,
                key: vid.key,
                position: index,
              })),
            );
          }
        }

        if (mediaEntries.length > 0) {
          await tx.insert(variantMedia).values(mediaEntries);
        }

        // 5. Update denormalized fields
        await updateProductVariantDenorms(tx, productId);
      });

      return { id: productId };
    }),
});
