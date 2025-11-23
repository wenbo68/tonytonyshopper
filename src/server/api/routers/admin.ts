// Path: ~/server/api/routers/admin.ts
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
  orders,
  products,
  productsToCategories,
  productVariants,
  users,
} from "~/server/db/schema";
import { updateProductVariantStats } from "~/server/utils/product"; // <--- 1. Import this
// import { Resend } from "resend"; // <--- Import Resend
import { env } from "~/env";
import { getSellHistoryInputSchema } from "~/type";

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
   * Get all orders in the system (Admin Only) with Filters & Sorting
   */
  getSellHistory: adminProcedure
    .input(getSellHistoryInputSchema) // Use new schema
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        id,
        dateMin,
        dateMax,
        customerName,
        customerEmail,
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

      if (priceMin !== undefined)
        conditions.push(gte(orders.totalAmount, priceMin.toString()));
      if (priceMax !== undefined)
        conditions.push(lte(orders.totalAmount, priceMax.toString()));

      if (status && status.length > 0) {
        conditions.push(inArray(orders.status, status as any[]));
      }

      if (carrier) conditions.push(ilike(orders.carrier, `%${carrier}%`));
      if (trackingNumber)
        conditions.push(ilike(orders.trackingNumber, `%${trackingNumber}%`));

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
      const orderHistory = await ctx.db.query.orders.findMany({
        where: inArray(orders.id, orderIds),
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

      // 6. Re-sort in memory to match the requested sort order (since 'inArray' doesn't guarantee order)
      // We can map the orderIds to the result.
      const orderMap = new Map(orderHistory.map((o) => [o.id, o]));
      const sortedOrders = orderIds.map((id) => orderMap.get(id)!);

      return {
        orders: sortedOrders,
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
