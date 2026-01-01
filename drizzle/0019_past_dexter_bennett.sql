CREATE TYPE "public"."reject_return_reason" AS ENUM('Return window expired', 'Item not eligible for return (digitial, hygiene, etc.)', 'Suspected return abuse or fraud', 'Must use original packaging (sensitive items)', 'Incomplete/damaged item');--> statement-breakpoint
CREATE TYPE "public"."return_reason" AS ENUM('Wrong item sent', 'Item doesn''t work', 'Item is incomplete or missing parts', 'Item/package damaged in transit', 'Item arrived late', 'Bought by mistake', 'Better price/alternative available');--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order" RENAME COLUMN "status_reason" TO "statusReason";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order_item" ADD COLUMN "returnReason" "return_reason";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order_item" ADD COLUMN "rejectReturnReason" "reject_return_reason";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order_item" ADD COLUMN "returnCost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order_item" ADD COLUMN "returnLabel" varchar(255);--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order_item" ADD COLUMN "refundedAmount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "public"."tonytonyshopper_order_item" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."order_item_status";--> statement-breakpoint
CREATE TYPE "public"."order_item_status" AS ENUM('paid', 'canceled', 'shipped', 'return_requested', 'return_rejected', 'return_approved', 'returned', 'refunded');--> statement-breakpoint
ALTER TABLE "public"."tonytonyshopper_order_item" ALTER COLUMN "status" SET DATA TYPE "public"."order_item_status" USING "status"::"public"."order_item_status";