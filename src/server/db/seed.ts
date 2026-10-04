/**
 * Resets the catalog and fills it with demo data.
 *
 * Run with:  pnpm db:seed -- --yes
 *
 * What it does, in order:
 *   1. Deletes every product image and return photo from UploadThing.
 *   2. Deletes all orders, products, and categories (reviews, cart items,
 *      variants, and media go with them through database cascades).
 *   3. Creates the categories and products from ./seed-data.ts, uploading
 *      each product's photos to UploadThing so they live alongside admin uploads.
 *
 * Users and their accounts are left untouched.
 */
import { UTApi } from "uploadthing/server";
import { db } from "~/server/db";
import {
  categories,
  orders,
  products,
  productsToCategories,
  productVariants,
  returnMedia,
  variantMedia,
} from "~/server/db/schema";
import { updateProductVariantDenorms } from "~/server/utils/product";
import { seedCategories, type SeedProduct } from "./seed-data";

const UPLOADTHING_DELETE_BATCH = 100;

const utapi = new UTApi();

interface UploadedImage {
  key: string;
  url: string;
}

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function deleteExistingUploads(): Promise<number> {
  const [variantRows, returnRows] = await Promise.all([
    db.select({ key: variantMedia.key }).from(variantMedia),
    db.select({ key: returnMedia.key }).from(returnMedia),
  ]);
  const keys = [...new Set([...variantRows, ...returnRows].map((r) => r.key))];

  for (const batch of chunk(keys, UPLOADTHING_DELETE_BATCH)) {
    const result = await utapi.deleteFiles(batch);
    if (!result.success) {
      throw new Error(
        `UploadThing refused to delete a batch of ${batch.length} files.`,
      );
    }
  }
  return keys.length;
}

async function clearCatalog(): Promise<void> {
  await db.transaction(async (tx) => {
    // Orders reference variants without cascade, so they go first.
    await tx.delete(orders);
    await tx.delete(products);
    await tx.delete(categories);
  });
}

async function uploadProductImages(
  product: SeedProduct,
): Promise<UploadedImage[]> {
  const slug = slugify(product.name);
  const results = await utapi.uploadFilesFromUrl(
    product.images.map((image, i) => ({
      url: image.url,
      name: `${slug}-${i + 1}.jpg`,
    })),
  );

  return results.map((result, i) => {
    if (result.error || !result.data) {
      throw new Error(
        `Upload failed for "${product.name}" image ${i + 1}: ${result.error?.message ?? "unknown error"}`,
      );
    }
    return { key: result.data.key, url: result.data.ufsUrl };
  });
}

async function createProduct(
  product: SeedProduct,
  categoryId: string,
): Promise<void> {
  const images = await uploadProductImages(product);

  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(products)
      .values({
        name: product.name,
        description: product.description,
        isFeatured: product.isFeatured ?? false,
      })
      .returning({ id: products.id });
    if (!created)
      throw new Error(`Failed to insert product "${product.name}".`);

    await tx.insert(productsToCategories).values({
      productId: created.id,
      categoryId,
    });

    const variants = await tx
      .insert(productVariants)
      .values(
        product.variants.map((variant) => ({
          productId: created.id,
          price: variant.price,
          stock: variant.stock,
          options: variant.options,
        })),
      )
      .returning({ id: productVariants.id });

    // Every variant shows the same photo set; the rows share the uploaded files.
    await tx.insert(variantMedia).values(
      variants.flatMap((variant) =>
        images.map((image, position) => ({
          variantId: variant.id,
          type: "image" as const,
          url: image.url,
          key: image.key,
          position,
        })),
      ),
    );

    await updateProductVariantDenorms(tx, created.id);
  });
}

async function main(): Promise<void> {
  if (!process.argv.includes("--yes")) {
    console.error(
      "This wipes all products, orders, and product images. Re-run with --yes to confirm.",
    );
    process.exit(1);
  }

  console.log("Deleting existing uploads from UploadThing...");
  const deleted = await deleteExistingUploads();
  console.log(`  removed ${deleted} files`);

  console.log("Clearing orders, products, and categories...");
  await clearCatalog();

  for (const category of seedCategories) {
    const [created] = await db
      .insert(categories)
      .values({ name: category.name })
      .returning({ id: categories.id });
    if (!created)
      throw new Error(`Failed to insert category "${category.name}".`);
    console.log(`Category: ${category.name}`);

    for (const product of category.products) {
      await createProduct(product, created.id);
      console.log(`  + ${product.name} (${product.images.length} images)`);
    }
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(
      "Seed failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  });
