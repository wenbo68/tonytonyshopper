CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TABLE "tonytonyshopper_variant_media" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"variantId" varchar(255) NOT NULL,
	"type" "media_type" NOT NULL,
	"url" text NOT NULL,
	"key" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tonytonyshopper_variant_media" ADD CONSTRAINT "tonytonyshopper_variant_media_variantId_tonytonyshopper_product_variant_id_fk" FOREIGN KEY ("variantId") REFERENCES "public"."tonytonyshopper_product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "variant_media_variant_idx" ON "tonytonyshopper_variant_media" USING btree ("variantId");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_media_variant_position_idx" ON "tonytonyshopper_variant_media" USING btree ("variantId","type","position");--> statement-breakpoint
ALTER TABLE "tonytonyshopper_product_variant" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_product_variant" DROP COLUMN "images";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_product" DROP COLUMN "videos";