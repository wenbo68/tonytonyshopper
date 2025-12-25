ALTER TABLE "tonytonyshopper_order" RENAME COLUMN "shipping_address" TO "shippingAddress";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order" RENAME COLUMN "billing_address" TO "billingAddress";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order" RENAME COLUMN "tracking_number" TO "trackingNumber";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order" ADD COLUMN "shippingMethod" varchar(255);--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order" ADD COLUMN "shippingTime" json;