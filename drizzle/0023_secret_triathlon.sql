DROP INDEX "comment_media_order_item_idx";--> statement-breakpoint
CREATE INDEX "comment_media_comment_id_idx" ON "tonytonyshopper_comment_media" USING btree ("commentId");