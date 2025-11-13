// src/server/api/routers/helpers.ts (or just at the top of your router file)
import { eq, avg, count, sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { products, comments } from '~/server/db/schema';

/**
 * Helper function to format the price string (from Drizzle) into a currency.
 */
export function formatCurrency(priceString: string | null | undefined) {
  if (!priceString) {
    return 'N/A';
  }
  const price = parseFloat(priceString);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Recalculates and updates the averageRating and reviewCount for a product.
 * MUST be called inside a Drizzle transaction.
 */
export async function updateProductStats(
  tx: PgTransaction<any, any, any>, // The transaction object
  productId: string
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
    : '0';
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
