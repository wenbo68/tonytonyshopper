// Path: ~/server/api/routers/admin.ts
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import {
  orders,
  products,
  productsToCategories,
  productVariants,
} from "~/server/db/schema";
import { updateProductVariantStats } from "~/server/utils/product"; // <--- 1. Import this
// import { Resend } from "resend"; // <--- Import Resend
import { env } from "~/env";

// Zod schema for a single variant
const variantSchema = z.object({
  name: z.string().min(1), // e.g., "Red / Medium"
  price: z.number().min(0.01),
  stock: z.number().int().min(0),
  images: z.string().url().array().optional(),
  options: z.record(z.string()), // { "color": "Red", "size": "Medium" }
});

// Zod schema for an UPDATED variant (has an optional ID)
const updateVariantSchema = variantSchema.extend({
  id: z.string().optional(),
});

// const resend = new Resend(env.RESEND_API_KEY); // <--- Initialize

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
        if (categoryIds.length > 0) {
          await tx.insert(productsToCategories).values(
            categoryIds.map((catId) => ({
              productId: newProductId,
              categoryId: catId,
            })),
          );
        }

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

        // 4. Update denormalized fields (minPrice, totalStock, etc.) <--- ADDED
        await updateProductVariantStats(tx, newProductId);

        return { id: newProductId };
      });

      return newProduct;
    }),

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
        variants: z.array(updateVariantSchema).min(1),
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
            updatedAt: new Date(), // Good practice to update this
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

        // 4. Update denormalized fields (minPrice, totalStock, etc.) <--- ADDED
        await updateProductVariantStats(tx, productId);
      });

      return { id: productId };
    }),

  /**
   * Get all orders in the system (Admin Only)
   */
  getSellHistory: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input;

      // 1. Get total count of orders
      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(orders);
      const totalItems = totalResult?.count ?? 0;
      const totalPages = Math.ceil(totalItems / pageSize);

      // 2. Get the actual data with relations
      const orderHistory = await ctx.db.query.orders.findMany({
        orderBy: [desc(orders.createdAt)],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        with: {
          user: {
            columns: { name: true, email: true, image: true },
          },
          orderItems: {
            with: {
              productVariant: {
                with: {
                  product: {
                    columns: { name: true },
                  },
                },
              },
            },
          },
        },
      });

      return {
        orders: orderHistory,
        totalPages,
        currentPage: page,
      };
    }),

  markAsShipped: adminProcedure
    .input(
      z.object({
        orderId: z.string(),
        trackingNumber: z.string(),
        carrier: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch the order first to get the user's email
      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: {
          user: true, // Fetch relation to get user email if logged in
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Determine the email to send to
      const email = order.user?.email ?? order.guestEmail;

      if (!email) {
        throw new Error("No email found for this order");
      }

      // 2. Update the database
      await ctx.db
        .update(orders)
        .set({
          status: "shipped",
          trackingNumber: input.trackingNumber,
          carrier: input.carrier,
        })
        .where(eq(orders.id, input.orderId));

      // // 3. Send the email using Resend
      // // NOTE: If you haven't verified a domain on Resend, 'from' must be 'onboarding@resend.dev'
      // // and 'to' must be your own email (for testing).
      // try {
      //   await resend.emails.send({
      //     from: "TonyTonyShopper <onboarding@resend.dev>",
      //     to: [email],
      //     subject: `Your order #${order.id.slice(0, 8)} has shipped!`,
      //     html: `
      //       <div style="font-family: sans-serif; color: #333;">
      //         <h1>Your order is on the way!</h1>
      //         <p>Great news! Your order has been handed over to the carrier.</p>

      //         <div style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; margin: 20px 0;">
      //           <p><strong>Carrier:</strong> ${input.carrier}</p>
      //           <p><strong>Tracking Number:</strong> ${input.trackingNumber}</p>
      //         </div>

      //         <p>You can track your package using the number above.</p>
      //         <p>Thank you for shopping with us!</p>
      //       </div>
      //     `,
      //   });
      // } catch (error) {
      //   // Don't block the UI if email fails, just log it
      //   console.error("Failed to send shipping email:", error);
      // }

      return { success: true };
    }),
});
