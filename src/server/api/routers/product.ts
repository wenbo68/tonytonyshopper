// Path: ~/server/api/routers/product.ts
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gt,
  gte,
  ilike,
  inArray,
  lte,
  or,
} from "drizzle-orm";
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
  productsToCategories,
  orders, //
} from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { getAllProductsInputSchema } from "~/type";
import { updateProductVariantStats } from "~/server/utils/product";

export const productRouter = createTRPCRouter({
  /**
   * Fetches all products with filtering, sorting, and pagination.
   */
  search: publicProcedure
    .input(getAllProductsInputSchema) // <-- Use new input schema
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        name,
        categories,
        minPrice,
        maxPrice,
        ratingMin,
        ratingMax,
        stock,
        order,
      } = input;

      const db = ctx.db;

      // --- 1. Build Dynamic WHERE clause ---
      const conditions = [];

      // Name Filter
      if (name) {
        conditions.push(ilike(products.name, `%${name}%`));
      }

      // Rating Filter
      if (ratingMin) {
        conditions.push(gte(products.averageRating, ratingMin.toString()));
      }
      if (ratingMax) {
        conditions.push(lte(products.averageRating, ratingMax.toString()));
      }

      // Price Filter (finds products where their price range overlaps with the filter range)
      if (minPrice) {
        conditions.push(gte(products.minPrice, minPrice.toString()));
      }
      if (maxPrice) {
        conditions.push(lte(products.minPrice, maxPrice.toString()));
      }

      // Stock Filter
      if (stock && stock.length > 0) {
        const stockConditions = [];
        if (stock.includes("none")) {
          stockConditions.push(eq(products.totalStock, 0));
        }
        if (stock.includes("some")) {
          stockConditions.push(
            and(
              gt(products.totalStock, 0),
              eq(products.hasOutOfStockVariants, true),
            ),
          );
        }
        if (stock.includes("all")) {
          stockConditions.push(
            and(
              gt(products.totalStock, 0),
              eq(products.hasOutOfStockVariants, false),
            ),
          );
        }
        if (stockConditions.length > 0) {
          conditions.push(or(...stockConditions));
        }
      }

      // Category Filter (finds products in *any* of the selected categories)
      if (categories && categories.length > 0) {
        conditions.push(
          exists(
            db
              .select()
              .from(productsToCategories)
              .where(
                and(
                  eq(productsToCategories.productId, products.id),
                  inArray(productsToCategories.categoryId, categories),
                ),
              ),
          ),
        );
      }

      const whereClause = and(...conditions);

      // --- 2. Build Dynamic ORDER BY clause ---
      let orderByClause;
      switch (order) {
        case "name-desc":
          orderByClause = desc(products.name);
          break;
        case "name-asc":
          orderByClause = asc(products.name);
          break;
        case "price-desc":
          orderByClause = desc(products.minPrice);
          break;
        case "price-asc":
          orderByClause = asc(products.minPrice);
          break;
        case "rating-desc":
          orderByClause = desc(products.averageRating);
          break;
        case "rating-asc":
          orderByClause = asc(products.averageRating);
          break;
        case "created-desc":
          orderByClause = desc(products.createdAt);
          break;
        case "created-asc":
          orderByClause = asc(products.createdAt);
          break;
      }

      // --- 3. Get Total Count (for pagination) ---
      const countQuery = db
        .select({ value: count() })
        .from(products)
        .where(whereClause);

      const [totalCountResult] = await countQuery;
      const totalProducts = totalCountResult?.value ?? 0;
      const totalPages = Math.ceil(totalProducts / pageSize);

      // --- 4. Get Paginated Data ---
      const paginatedProducts = await db.query.products.findMany({
        where: whereClause,
        orderBy: [orderByClause],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        with: {
          variants: true, // Eager load variants for the product cards
        },
      });

      return {
        products: paginatedProducts,
        totalPages,
        currentPage: page,
      };
    }),

  // /**
  //  * Fetches all products with their variants.
  //  */
  // getAll: publicProcedure.query(async ({ ctx }) => {
  //   const products = await ctx.db.query.products.findMany({
  //     with: {
  //       variants: true, // Eager load all variants for each product
  //     },
  //   });
  //   return products;
  // }),

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
   * Fetch all categories for the filter dropdown.
   * Sorted alphabetically by name.
   */
  getCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.categories.findMany({
      orderBy: [asc(categories.name)],
    });
  }),

  /**
   * A temporary mutation to seed the database.
   */
  seedDatabase: publicProcedure.mutation(async ({ ctx }) => {
    try {
      console.log("Clearing old data...");

      // 1. Delete orders first (this cascades to orderItems)
      await ctx.db.delete(orders);

      // 2. Now we can safely delete products (cascades to variants, cartItems, etc.)
      await ctx.db.delete(products);
      await ctx.db.delete(categories);

      console.log("Inserting new categories...");
      const [apparelCategory] = await ctx.db
        .insert(categories)
        .values([{ name: "Apparel" }])
        .returning();

      console.log("Inserting new products and variants...");

      // --- Use a Transaction for consistency ---
      await ctx.db.transaction(async (tx) => {
        // 1. Classic Tee
        const [tee] = await tx
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
          await tx.insert(productVariants).values([
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
              images: [
                "https://placehold.co/600x600/00f/fff.png?text=Tee+Blue",
              ],
              options: { color: "Blue" },
            },
          ]);

          await tx.insert(productsToCategories).values({
            productId: tee.id,
            categoryId: apparelCategory.id,
          });

          // Calculate stats
          await updateProductVariantStats(tx, tee.id);
        }

        // 2. Jeans
        const [jeans] = await tx
          .insert(products)
          .values([
            {
              name: "Modern Denim Jeans",
              description: "Stylish, comfortable slim-fit jeans.",
            },
          ])
          .returning();

        if (apparelCategory && jeans) {
          await tx.insert(productVariants).values([
            {
              productId: jeans.id,
              name: "Medium Wash / 32x30",
              price: "59.99",
              stock: 30,
              images: [
                "https://placehold.co/600x600/e0e0e0/333.png?text=Jeans",
              ],
              options: { wash: "Medium", size: "32x30" },
            },
          ]);

          await tx.insert(productsToCategories).values({
            productId: jeans.id,
            categoryId: apparelCategory.id,
          });

          // Calculate stats
          await updateProductVariantStats(tx, jeans.id);
        }
      });

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
