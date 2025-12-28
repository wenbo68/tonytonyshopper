ALTER TABLE "tonytonyshopper_order_item" ADD COLUMN "carrier" varchar(50);--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order_item" ADD COLUMN "trackingNumber" varchar(255);--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order_item" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order" DROP COLUMN "carrier";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order" DROP COLUMN "trackingNumber";