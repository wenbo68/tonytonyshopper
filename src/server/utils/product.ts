// src/server/api/routers/helpers.ts (or just at the top of your router file)
import { eq, avg, count, sql, min, max, sum } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { products, comments, productVariants } from "~/server/db/schema";

export function formatNumber(num: number) {
  return Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

export function formatCurrency(priceString: string | null | undefined) {
  if (!priceString) {
    return "N/A";
  }
  const price = parseFloat(priceString);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export const formatOptionsCaption = (
  options: Record<string, string> | null,
) => {
  if (!options) return "";
  return Object.entries(options)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
};

/**
 * Recalculates and updates the averageRating and reviewCount for a product.
 * MUST be called inside a Drizzle transaction.
 */
export async function updateProductReviewDenorms(
  tx: PgTransaction<any, any, any>, // The transaction object
  productId: string,
) {
  // 1. Calculate the new stats *from the comments table*
  // We use COUNT(comments.rating) which ONLY counts non-null ratings.
  const [stats] = await tx
    .select({
      average: avg(comments.rating),
      count: count(comments.rating), // This is key! Only counts non-null ratings
    })
    .from(comments)
    .where(eq(comments.productId, productId));

  const averageRating = stats?.average
    ? parseFloat(stats.average).toFixed(1)
    : "0";
  const reviewCount = stats?.count ?? 0;

  // 2. Update the products table with the new stats
  await tx
    .update(products)
    .set({
      averageRating: averageRating,
      reviewCount: reviewCount,
    })
    .where(eq(products.id, productId));
}

/**
 * Recalculates and updates the variant aggregate fields for a product.
 * MUST be called inside a Drizzle transaction.
 */
export async function updateProductVariantDenorms(
  tx: PgTransaction<any, any, any>, // The transaction object
  productId: string,
) {
  // 1. Calculate the new stats *from the productVariants table*
  const [stats] = await tx
    .select({
      minPrice: min(productVariants.price),
      maxPrice: max(productVariants.price),
      totalStock: sum(productVariants.stock).mapWith(Number), // Convert sum to number
      minStock: min(productVariants.stock).mapWith(Number), // Get min stock to check if any are 0
    })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  const minPrice = stats?.minPrice ?? "0";
  const maxPrice = stats?.maxPrice ?? "0";
  const totalStock = stats?.totalStock ?? 0;

  // If the lowest stock for any variant is 0, this is true.
  const hasOutOfStockVariants = (stats?.minStock ?? 0) === 0 && totalStock > 0;

  // 2. Update the products table with the new stats
  await tx
    .update(products)
    .set({
      minPrice,
      maxPrice,
      totalStock,
      hasOutOfStockVariants,
    })
    .where(eq(products.id, productId));
}
