-- 1. Add the column as nullable first
ALTER TABLE "tonytonyshopper_order" ADD COLUMN "totalAmount" numeric(10, 2);

-- 2. Populate the column using the sum of existing values
-- We use COALESCE to treat NULL tax or shippingFee values as 0
UPDATE "tonytonyshopper_order" 
SET "totalAmount" = "subtotal" + COALESCE("tax", 0) + COALESCE("shippingFee", 0);

-- 3. Now that data is populated, apply the NOT NULL constraint and DEFAULT value
ALTER TABLE "tonytonyshopper_order" ALTER COLUMN "totalAmount" SET NOT NULL;
ALTER TABLE "tonytonyshopper_order" ALTER COLUMN "totalAmount" SET DEFAULT '0';