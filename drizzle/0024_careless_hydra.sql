ALTER TABLE "tonytonyshopper_order_item_media" RENAME TO "tonytonyshopper_return_media";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_return_media" DROP CONSTRAINT "tonytonyshopper_order_item_media_orderItemId_tonytonyshopper_order_item_id_fk";
--> statement-breakpoint
DROP INDEX "order_item_media_order_item_idx";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_return_media" ADD CONSTRAINT "tonytonyshopper_return_media_orderItemId_tonytonyshopper_order_item_id_fk" FOREIGN KEY ("orderItemId") REFERENCES "public"."tonytonyshopper_order_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "return_media_order_item_id_idx" ON "tonytonyshopper_return_media" USING btree ("orderItemId");