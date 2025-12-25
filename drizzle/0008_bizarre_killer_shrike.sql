ALTER TABLE "tonytonyshopper_order" RENAME COLUMN "totalAmount" TO "subtotal";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order" RENAME COLUMN "taxAmount" TO "tax";--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order" RENAME COLUMN "shippingAmount" TO "shippingFee";