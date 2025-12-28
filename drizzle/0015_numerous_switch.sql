ALTER TYPE "public"."order_status_reason" ADD VALUE 'abandoned_stripe_expired' BEFORE 'abandoned_payment_failed';--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order_item" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order_item" ALTER COLUMN "status" DROP NOT NULL;