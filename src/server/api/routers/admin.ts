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
  getAllOrdersInputSchema,
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
        await updateProductVariantDenorms(tx, productId);
      });

      return { id: productId };
    }),

  /**
   * Get all orders in the system (Admin Only) with Filters & Sorting
   * This procedure needs inArray and in memory sorting b/c it needs more than 1 table (orders + users)
   */
  getAllOrders: adminProcedure
    .input(getAllOrdersInputSchema)
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        id,
        dateMin,
        dateMax,
        customerName,
        customerEmail,
        itemsMin,
        itemsMax,
        itemName,
        priceMin,
        priceMax,
        status,
        carrier,
        trackingNumber,
        sort,
      } = input;

      // 1. Build Where Conditions
      const conditions = [];

      if (id) conditions.push(ilike(orders.id, `%${id}%`));

      if (dateMin) conditions.push(gte(orders.createdAt, new Date(dateMin)));
      if (dateMax) {
        const d = new Date(dateMax);
        d.setHours(23, 59, 59, 999);
        conditions.push(lte(orders.createdAt, d));
      }

      if (customerName) {
        // Filter by user name (only applies to logged-in users)
        conditions.push(ilike(users.name, `%${customerName}%`));
      }

      if (customerEmail) {
        // Check both registered email OR guest email
        conditions.push(
          or(
            ilike(users.email, `%${customerEmail}%`),
            ilike(orders.guestEmail, `%${customerEmail}%`),
          ),
        );
      }

      if (itemsMin || itemsMax) {
        // Create a subquery to find order IDs that match the item count criteria
        const subQuery = ctx.db
          .select({ orderId: orderItems.orderId })
          .from(orderItems)
          .groupBy(orderItems.orderId)
          .having(
            and(
              itemsMin
                ? gte(sql`sum(${orderItems.quantity})`, itemsMin)
                : undefined,
              itemsMax
                ? lte(sql`sum(${orderItems.quantity})`, itemsMax)
                : undefined,
            ),
          );
        // Filter the main orders query to only include IDs returned by the subquery
        conditions.push(inArray(orders.id, subQuery));
      }

      if (itemName) {
        // Find orders that contain an item with a matching product name
        const itemSubQuery = ctx.db
          .select({ orderId: orderItems.orderId })
          .from(orderItems)
          .innerJoin(
            productVariants,
            eq(orderItems.productVariantId, productVariants.id),
          )
          .innerJoin(products, eq(productVariants.productId, products.id))
          .where(ilike(products.name, `%${itemName}%`)); // Case-insensitive match

        conditions.push(inArray(orders.id, itemSubQuery));
      }

      if (priceMin) conditions.push(gte(orders.subtotal, priceMin.toString()));
      if (priceMax) conditions.push(lte(orders.subtotal, priceMax.toString()));

      if (status && status.length > 0) {
        conditions.push(inArray(orders.status, status as any[]));
      }

      // if (carrier) conditions.push(ilike(orders.carrier, `%${carrier}%`));
      // if (trackingNumber)
      //   conditions.push(ilike(orders.trackingNumber, `%${trackingNumber}%`));

      const whereClause = and(...conditions);

      // 2. Build Sort Clause
      let orderByClause;
      switch (sort) {
        case "date-asc":
          orderByClause = asc(orders.createdAt);
          break;
        case "price-desc":
          orderByClause = desc(orders.totalAmount);
          break;
        case "price-asc":
          orderByClause = asc(orders.totalAmount);
          break;
        case "name-desc":
          orderByClause = desc(users.name);
          break;
        case "name-asc":
          orderByClause = asc(users.name);
          break;
        case "email-desc":
          // Sort by coalesced email
          orderByClause = sql`COALESCE(${users.email}, ${orders.guestEmail}) DESC`;
          break;
        case "email-asc":
          orderByClause = sql`COALESCE(${users.email}, ${orders.guestEmail}) ASC`;
          break;
        case "date-desc":
        default:
          orderByClause = desc(orders.createdAt);
          break;
      }

      // 3. Pagination Count (Joined with users for filtering)
      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(whereClause);

      const totalItems = totalResult?.count ?? 0;
      const totalPages = Math.ceil(totalItems / pageSize);

      // 4. Fetch Data (Manually join to allow filtering/sorting on user fields)
      // We use .select().from().leftJoin() instead of .query.findMany() to strictly control the Join
      // needed for filtering/sorting, but then we need to reconstruct the nested objects if we want relations.
      // OR we can use findMany if we pass the ID list.

      // Strategy: Get IDs first using the complex filter/sort
      const rows = await ctx.db
        .select({
          id: orders.id,
          // We select sort columns to ensure order is preserved if needed, though usually ID list is enough if we map back
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const orderIds = rows.map((r) => r.id);

      if (orderIds.length === 0) {
        return { orders: [], totalPages, currentPage: page };
      }

      // 5. Fetch full object data for these IDs using relational query
      // Note: This second query might return items in a different order, so we re-sort in JS.
      const allOrders = await ctx.db.query.orders.findMany({
        where: inArray(orders.id, orderIds),
        with: {
          user: {
            columns: { name: true, email: true, image: true },
          },
          orderItems: {
            with: {
              productVariant: {
                with: {
                  media: true,
                  product: {
                    columns: { name: true },
                  },
                },
              },
            },
          },
        },
      });

      // 6. Re-sort in memory to match the given sort order (since 'inArray' doesn't guarantee order)
      // We can map the orderIds to the result.
      const orderMap = new Map(allOrders.map((o) => [o.id, o]));
      const sortedOrders = orderIds.map((id) => orderMap.get(id)!);

      // 7. sort order items in each order
      sortedOrders.forEach((order) => {
        order.orderItems.sort((a, b) => {
          // A. Primary Sort: Product Name
          const prodNameA = a.productVariant.product.name.toLowerCase();
          const prodNameB = b.productVariant.product.name.toLowerCase();
          if (prodNameA < prodNameB) return -1;
          if (prodNameA > prodNameB) return 1;

          // B. Secondary Sort: Variant Name (Options)
          const variantNameA = a.productVariant.name?.toLowerCase() ?? "";
          const variantNameB = b.productVariant.name?.toLowerCase() ?? "";
          if (variantNameA < variantNameB) return -1;
          if (variantNameA > variantNameB) return 1;

          // C. Tertiary Sort: Status (Custom Order)
          const priorityA = getOrderItemStatusPriority(a.status);
          const priorityB = getOrderItemStatusPriority(b.status);

          return priorityA - priorityB;
        });
      });

      return {
        orders: sortedOrders,
        totalPages,
        currentPage: page,
      };
    }),
});
