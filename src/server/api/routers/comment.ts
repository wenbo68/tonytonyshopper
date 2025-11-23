import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { comments, products, users } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import {
  GetCommentTreeInputSchema,
  type CommentTree,
  type FlatCommentWithUser,
} from "~/type";
import { updateProductReviewStats } from "~/server/utils/product";

export const commentRouter = createTRPCRouter({
  getAverageRating: publicProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { productId } = input;

      const product = await ctx.db.query.products.findFirst({
        where: eq(products.id, productId),
        columns: { averageRating: true, reviewCount: true },
      });

      return {
        averageRating: product?.averageRating
          ? parseFloat(product.averageRating)
          : 0,
        ratingCount: product?.reviewCount ?? 0,
      };
    }),

  getCommentTree: publicProcedure
    .input(GetCommentTreeInputSchema)
    .query(async ({ ctx, input }) => {
      const { productId, rating, order, page, pageSize } = input;

      const conditions = [isNull(comments.parentId)];
      conditions.push(eq(comments.productId, productId));
      if (rating && rating.length > 0) {
        conditions.push(inArray(comments.rating, rating));
      }
      const whereClause = and(...conditions);

      const countResult = await ctx.db
        .select({ value: count() })
        .from(comments)
        .where(whereClause);

      const totalCommentCount = countResult[0]?.value ?? 0;
      const totalPages = Math.ceil(totalCommentCount / pageSize);

      // 3. Build the dynamic ORDER BY clauses for use in the raw SQL
      let topLevelOrderByClause;
      let finalOrderByClause;

      switch (order) {
        case "rating-desc":
          topLevelOrderByClause = desc(comments.rating); // Use Drizzle's desc() helper
          finalOrderByClause = sql`root_rating DESC, "createdAt" ASC`;
          break;
        case "rating-asc":
          topLevelOrderByClause = asc(comments.rating); // Use Drizzle's asc() helper
          finalOrderByClause = sql`root_rating ASC, "createdAt" ASC`;
          break;
        case "created-asc":
          topLevelOrderByClause = asc(comments.createdAt); // Use Drizzle's asc() helper
          finalOrderByClause = sql`root_created_at ASC, "createdAt" ASC`;
          break;
        default: // 'created-desc'
          topLevelOrderByClause = desc(comments.createdAt); // Use Drizzle's desc() helper
          finalOrderByClause = sql`root_created_at DESC, "createdAt" ASC`;
          break;
      }

      // 4. Use a single RAW Recursive CTE query for everything
      const query = sql<FlatCommentWithUser>`
        WITH RECURSIVE 
        paginated_top_level_ids AS (
          -- FIX: Removed the "AS c" alias.
          -- The Drizzle whereClause and orderBy objects correctly reference the base table.
          SELECT ${comments.id} as id
          FROM ${comments}
          WHERE ${whereClause}
          ORDER BY ${topLevelOrderByClause}
          LIMIT ${pageSize}
          OFFSET ${(page - 1) * pageSize}
        ),
        comment_tree AS (
          -- Base Case: Alias 'c' is fine here because it's used consistently within this block.
          SELECT 
            c.*,
            c.rating AS root_rating,
            c."createdAt" AS root_created_at
          FROM ${comments} AS c
          WHERE c.id IN (SELECT id FROM paginated_top_level_ids)
          
          UNION ALL
          
          -- Recursive Step: This part is unchanged and correct.
          SELECT 
            c.*,
            ct.root_rating,
            ct.root_created_at
          FROM ${comments} AS c
          JOIN comment_tree AS ct ON ct.id = c."parentId"
        )
        -- Final selection, joining with users (unchanged and correct)
        SELECT 
          ct.id,
          ct.text,
          ct.rating,
          ct."userId",
          ct."parentId",
          ct."createdAt",
          u.name AS "userName",
          u.image AS "userImage"
        FROM comment_tree AS ct
        LEFT JOIN ${users} AS u ON ct."userId" = u.id
        ORDER BY ${finalOrderByClause};
      `;

      const rawResult = await ctx.db.execute(query);
      // db.execute returns a RowList (an array-like result); cast it to the expected type.
      const commentResult = rawResult as unknown as FlatCommentWithUser[];

      // 5. Build the tree structure (this logic remains the same and is correct)
      const commentMap = new Map<string, CommentTree>();
      const topLevelCommentIds = commentResult
        .filter((c) => c.parentId === null)
        .map((c) => c.id);

      for (const comment of commentResult) {
        const { userName, userImage, ...commentData } = comment;
        commentMap.set(comment.id, {
          ...commentData,
          user: { name: userName, image: userImage },
          replies: [],
        });
      }

      const commentTree: CommentTree[] = [];
      for (const comment of commentResult) {
        const commentNode = commentMap.get(comment.id)!;
        if (comment.parentId && commentMap.has(comment.parentId)) {
          const parentNode = commentMap.get(comment.parentId)!;
          parentNode.replies.push(commentNode);
        } else if (topLevelCommentIds.includes(comment.id)) {
          // This check ensures we only push the paginated top-level comments
          commentTree.push(commentNode);
        }
      }

      return {
        commentTree,
        totalPages,
      };
    }),

  /**
   * Adds a new comment or reply.
   */
  add: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        parentId: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
        text: z.string().min(1, "Comment cannot be empty."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, parentId, rating, text } = input;
      const userId = ctx.session.user.id;

      // Wrap everything in a transaction
      await ctx.db.transaction(async (tx) => {
        // 1. Insert the new comment
        await tx.insert(comments).values({
          userId,
          productId,
          parentId,
          rating,
          text,
        });

        // 2. If a rating was provided, update the product stats
        if (rating !== undefined && rating !== null) {
          await updateProductReviewStats(tx, productId);
        }
      });

      return { success: true };
    }),

  /**
   * Updates an existing comment or reply.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        // IMPORTANT: Allow explicitly setting rating to 'null' to remove it
        rating: z.number().min(1).max(5).nullable().optional(),
        text: z.string().min(1, "Comment cannot be empty.").optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, text, rating } = input;
      const userId = ctx.session.user.id;

      // Get the original product ID *before* the transaction,
      // as we need it even if the comment is deleted.
      const originalComment = await ctx.db.query.comments.findFirst({
        where: eq(comments.id, id),
      });

      if (!originalComment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (originalComment.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own comments.",
        });
      }

      // Build the update object. This only updates fields that were passed.
      const updateData: { text?: string; rating?: number | null } = {};
      if (text !== undefined) {
        updateData.text = text;
      }
      if (rating !== undefined) {
        updateData.rating = rating; // 'rating' can be number or null
      }

      if (Object.keys(updateData).length === 0) {
        // No changes were actually sent
        return { success: true, message: "No changes provided." };
      }

      // Wrap in a transaction
      await ctx.db.transaction(async (tx) => {
        // 1. Perform the update
        await tx.update(comments).set(updateData).where(eq(comments.id, id));

        // 2. If the rating was changed, update stats
        // We must check if 'rating' was part of the input (even if it was set to null)
        if (rating !== undefined) {
          await updateProductReviewStats(tx, originalComment.productId);
        }
      });

      return { success: true };
    }),

  /**
   * Deletes a comment or reply (and all its children).
   * Updates product stats if a top-level review with a rating is deleted.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const userId = ctx.session.user.id;

      // 1. Find the comment to get its details *before* deleting
      const commentToDelete = await ctx.db.query.comments.findFirst({
        where: eq(comments.id, id),
      });

      if (!commentToDelete) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (commentToDelete.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own comments.",
        });
      }

      // 2. Perform the delete and stats update in a transaction
      await ctx.db.transaction(async (tx) => {
        // Delete the comment. 'onDelete: cascade' handles children.
        await tx.delete(comments).where(eq(comments.id, id));

        // 3. Check if we need to update the product stats
        const wasTopLevelReview = !commentToDelete.parentId;
        const hadRating = commentToDelete.rating !== null;

        if (wasTopLevelReview && hadRating) {
          // If it was a top-level review that had a rating,
          // recalculate the stats for its product.
          await updateProductReviewStats(tx, commentToDelete.productId);
        }
      });

      return { success: true };
    }),
});
