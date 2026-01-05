CREATE TABLE "tonytonyshopper_comment_media" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"commentId" varchar(255) NOT NULL,
	"type" "media_type" NOT NULL,
	"url" text NOT NULL,
	"key" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tonytonyshopper_order_item_media" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"orderItemId" varchar(255) NOT NULL,
	"type" "media_type" NOT NULL,
	"url" text NOT NULL,
	"key" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tonytonyshopper_comment_media" ADD CONSTRAINT "tonytonyshopper_comment_media_commentId_tonytonyshopper_comment_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."tonytonyshopper_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order_item_media" ADD CONSTRAINT "tonytonyshopper_order_item_media_orderItemId_tonytonyshopper_order_item_id_fk" FOREIGN KEY ("orderItemId") REFERENCES "public"."tonytonyshopper_order_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_media_order_item_idx" ON "tonytonyshopper_comment_media" USING btree ("commentId");--> statement-breakpoint
CREATE INDEX "order_item_media_order_item_idx" ON "tonytonyshopper_order_item_media" USING btree ("orderItemId");