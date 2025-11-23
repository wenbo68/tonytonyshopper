ALTER TABLE "tonytonyshopper_order" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_product" ADD COLUMN "minPrice" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_product" ADD COLUMN "maxPrice" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_product" ADD COLUMN "total_stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_product" ADD COLUMN "has_out_of_stock_variants" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."tonytonyshopper_order" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'cancelled', 'paid', 'shipped');--> statement-breakpoint
ALTER TABLE "public"."tonytonyshopper_order" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";