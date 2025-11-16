// Path: ~/server/api/routers/product.ts
import { eq, inArray } from "drizzle-orm";
import z from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import {
  products,
  productVariants, //
  categories, //
  productsToCategories, //
} from "~/server/db/schema";
import { TRPCError } from "@trpc/server";

// Zod schema for a single variant
const variantSchema = z.object({
  name: z.string().min(1), // e.g., "Red / Medium"
  price: z.number().min(0.01), //
  stock: z.number().int().min(0), //
  images: z.string().url().array().optional(), //
  options: z.record(z.string()), // { "color": "Red", "size": "Medium" }
});

export const productRouter = createTRPCRouter({
  // /**
  //  * Add a new product (Admin Only)
  //  * (From your admin.ts)
  //  */
  // add: adminProcedure
  //   .input(
  //     z.object({
  //       name: z.string().min(1), //
  //       description: z.string().optional(), //
  //       videoUrls: z.string().url().array().optional(), //
  //       categoryIds: z.string().array().min(1), //
  //       variants: z.array(variantSchema).min(1), //
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     // This logic was correct and remains unchanged
  //     const { name, description, videoUrls, categoryIds, variants } = input;

  //     const newProduct = await ctx.db.transaction(async (tx) => {
  //       const [createdProduct] = await tx
  //         .insert(products)
  //         .values({
  //           name,
  //           description,
  //           videos: videoUrls,
  //         })
  //         .returning({ id: products.id }); //

  //       if (!createdProduct?.id) {
  //         tx.rollback();
  //         throw new Error("Failed to create product.");
  //       }
  //       const newProductId = createdProduct.id;

  //       await tx.insert(productsToCategories).values(
  //         categoryIds.map((catId) => ({
  //           productId: newProductId,
  //           categoryId: catId,
  //         })),
  //       ); //

  //       await tx.insert(productVariants).values(
  //         variants.map((variant) => ({
  //           productId: newProductId,
  //           name: variant.name,
  //           price: variant.price.toString(),
  //           stock: variant.stock,
  //           images: variant.images,
  //           options: variant.options,
  //         })),
  //       ); //

  //       return { id: newProductId };
  //     });

  //     return newProduct;
  //   }),

  /**
   * Fetches all products with their variants.
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.query.products.findMany({
      with: {
        variants: true, // Eager load all variants for each product
      },
    });
    return products;
  }),

  /**
   * Fetches a single product by its ID, with all its variants and categories.
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: eq(products.id, input.id),
        with: {
          variants: true, // Get all variants
          productsToCategories: {
            with: {
              category: true, // Get category info
            },
          },
        },
      });
      // Will be `undefined` if not found, not `null`
      return product;
    }),

  /**
   * Fetches variant details for a list of variant IDs.
   * Used to "hydrate" the guest's localStorage cart.
   */
  getVariantsByIds: publicProcedure
    .input(z.array(z.string()))
    .query(async ({ ctx, input }) => {
      if (input.length === 0) {
        return [];
      }
      // Query productVariants, not products
      const variantList = await ctx.db.query.productVariants.findMany({
        where: inArray(productVariants.id, input),
        with: {
          product: true, // Join with the parent product
        },
      });
      return variantList;
    }),

  /**
   * Get all categories (for the form dropdown)
   * (Unchanged)
   */
  getCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.categories.findMany(); //
  }),

  /**
   * A temporary mutation to seed the database.
   * UPDATED for the new schema.
   */
  seedDatabase: publicProcedure.mutation(async ({ ctx }) => {
    try {
      console.log("Clearing old data...");
      await ctx.db.delete(products); // Deleting products will cascade to variants
      await ctx.db.delete(categories);

      console.log("Inserting new categories...");
      const [apparelCategory] = await ctx.db
        .insert(categories)
        .values([{ name: "Apparel" }])
        .returning();

      console.log("Inserting new products and variants...");

      // 1. Classic Tee
      const [tee] = await ctx.db
        .insert(products)
        .values([
          {
            name: "Classic Cotton Tee",
            description: "A super soft, 100% cotton tee.",
            isFeatured: true,
          },
        ])
        .returning();

      if (apparelCategory && tee) {
        await ctx.db.insert(productVariants).values([
          {
            productId: tee.id,
            name: "Red",
            price: "24.99",
            stock: 100,
            images: ["https://placehold.co/600x600/f00/fff.png?text=Tee+Red"],
            options: { color: "Red" },
          },
          {
            productId: tee.id,
            name: "Blue",
            price: "24.99",
            stock: 50,
            images: ["https://placehold.co/600x600/00f/fff.png?text=Tee+Blue"],
            options: { color: "Blue" },
          },
        ]);

        await ctx.db.insert(productsToCategories).values({
          productId: tee.id,
          categoryId: apparelCategory.id,
        });
      }

      // 2. Jeans
      const [jeans] = await ctx.db
        .insert(products)
        .values([
          {
            name: "Modern Denim Jeans",
            description: "Stylish, comfortable slim-fit jeans.",
          },
        ])
        .returning();

      if (apparelCategory && jeans) {
        await ctx.db.insert(productVariants).values([
          {
            productId: jeans.id,
            name: "Medium Wash / 32x30",
            price: "59.99",
            stock: 30,
            images: ["https://placehold.co/600x600/e0e0e0/333.png?text=Jeans"],
            options: { wash: "Medium", size: "32x30" },
          },
        ]);

        await ctx.db.insert(productsToCategories).values({
          productId: jeans.id,
          categoryId: apparelCategory.id,
        });
      }

      return { success: true, message: "Database seeded successfully!" };
    } catch (error) {
      console.error("Failed to seed database:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to seed database.",
      });
    }
  }),
});
