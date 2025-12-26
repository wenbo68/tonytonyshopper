CREATE TYPE "public"."order_item_status" AS ENUM('paid', 'cancelled', 'shipped', 'returned', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."order_status_reason" AS ENUM('abandoned_voluntary', 'abandoned_payment_failed', 'abandoned_out_of_stock', 'abandoned_code_error');--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order_item" ADD COLUMN "status" "order_item_status" DEFAULT 'paid' NOT NULL;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order" ADD COLUMN "status_reason" "order_status_reason";--> statement-breakpoint
ALTER TABLE "public"."tonytonyshopper_order" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'abandoned', 'paid');--> statement-breakpoint
ALTER TABLE "public"."tonytonyshopper_order" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";