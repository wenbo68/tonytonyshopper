// src/scripts/clean-uploadthing.ts
import { UTApi } from "uploadthing/server";
import { db } from "../server/db"; // Adjust path if needed
import { variantMedia } from "../server/db/schema";

const utapi = new UTApi();

async function main() {
  console.log("🔍 Starting UploadThing Cleanup...");

  // 1. Fetch all valid file keys from your database
  // We only need the 'key' column
  const dbMedia = await db.select({ key: variantMedia.key }).from(variantMedia);
  const validKeys = new Set(dbMedia.map((m) => m.key));

  console.log(`✅ Found ${validKeys.size} valid files in the database.`);

  let filesProcessed = 0;
  let filesDeleted = 0;
  let hasMore = true;
  let offset = 0;

  // 2. Iterate through UploadThing files using pagination
  while (hasMore) {
    // Fetch a batch of 500 files (max limit)
    const { files, hasMore: more } = await utapi.listFiles({
      limit: 500,
      offset,
    });

    hasMore = more;
    offset += files.length;
    filesProcessed += files.length;

    // 3. Identify orphans
    const orphans = files.filter((file) => !validKeys.has(file.key));

    if (orphans.length > 0) {
      const orphanKeys = orphans.map((o) => o.key);

      // 4. Delete orphans
      // deleteFiles accepts a single key or array of keys
      await utapi.deleteFiles(orphanKeys);

      filesDeleted += orphans.length;
      console.log(`🗑️ Deleted batch of ${orphans.length} orphan files.`);
    }
  }

  console.log("🎉 Cleanup complete!");
  console.log(`📊 Processed: ${filesProcessed}`);
  console.log(`🚫 Deleted:   ${filesDeleted}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Cleanup failed:", err);
  process.exit(1);
});
