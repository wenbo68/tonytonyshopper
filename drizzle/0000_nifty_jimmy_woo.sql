CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'shipped', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "tonytonyshopper_account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "tonytonyshopper_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "tonytonyshopper_cart_item" (
	"userId" varchar(255) NOT NULL,
	"productVariantId" varchar(255),
	"quantity" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "tonytonyshopper_cart_item_userId_productVariantId_pk" PRIMARY KEY("userId","productVariantId")
);
--> statement-breakpoint
CREATE TABLE "tonytonyshopper_category" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "tonytonyshopper_category_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tonytonyshopper_comment" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"rating" integer,
	"text" text NOT NULL,
	"userId" varchar(255) NOT NULL,
	"productId" varchar(255) NOT NULL,
	"parentId" varchar(255),
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "tonytonyshopper_order_item" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"orderId" varchar(255) NOT NULL,
	"productVariantId" varchar(255),
	"quantity" integer NOT NULL,
	"priceAtPurchase" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tonytonyshopper_order" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255),
	"guestEmail" varchar(255),
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"totalAmount" numeric(10, 2) NOT NULL,
	"shipping_address" json,
	"billing_address" json,
	"paymentIntentId" varchar(255),
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "tonytonyshopper_order_paymentIntentId_unique" UNIQUE("paymentIntentId")
);
--> statement-breakpoint
CREATE TABLE "tonytonyshopper_product_variant" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"productId" varchar(255) NOT NULL,
	"name" varchar(255),
	"price" numeric(10, 2) NOT NULL,
	"images" json,
	"stock" integer DEFAULT 0 NOT NULL,
	"options" json
);
--> statement-breakpoint
CREATE TABLE "tonytonyshopper_product" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"videos" json,
	"is_featured" boolean DEFAULT false NOT NULL,
	"averageRating" numeric(2, 1) DEFAULT '0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tonytonyshopper_products_to_categories" (
	"productId" varchar(255) NOT NULL,
	"categoryId" varchar(255) NOT NULL,
	CONSTRAINT "tonytonyshopper_products_to_categories_productId_categoryId_pk" PRIMARY KEY("productId","categoryId")
);
--> statement-breakpoint
CREATE TABLE "tonytonyshopper_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tonytonyshopper_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255),
	"role" "user_role" DEFAULT 'user' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tonytonyshopper_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "tonytonyshopper_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "tonytonyshopper_account" ADD CONSTRAINT "tonytonyshopper_account_userId_tonytonyshopper_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."tonytonyshopper_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_cart_item" ADD CONSTRAINT "tonytonyshopper_cart_item_userId_tonytonyshopper_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."tonytonyshopper_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_cart_item" ADD CONSTRAINT "tonytonyshopper_cart_item_productVariantId_tonytonyshopper_product_variant_id_fk" FOREIGN KEY ("productVariantId") REFERENCES "public"."tonytonyshopper_product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_comment" ADD CONSTRAINT "tonytonyshopper_comment_userId_tonytonyshopper_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."tonytonyshopper_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_comment" ADD CONSTRAINT "tonytonyshopper_comment_productId_tonytonyshopper_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."tonytonyshopper_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_comment" ADD CONSTRAINT "tonytonyshopper_comment_parentId_tonytonyshopper_comment_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."tonytonyshopper_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order_item" ADD CONSTRAINT "tonytonyshopper_order_item_orderId_tonytonyshopper_order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."tonytonyshopper_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order_item" ADD CONSTRAINT "tonytonyshopper_order_item_productVariantId_tonytonyshopper_product_variant_id_fk" FOREIGN KEY ("productVariantId") REFERENCES "public"."tonytonyshopper_product_variant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_order" ADD CONSTRAINT "tonytonyshopper_order_userId_tonytonyshopper_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."tonytonyshopper_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_product_variant" ADD CONSTRAINT "tonytonyshopper_product_variant_productId_tonytonyshopper_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."tonytonyshopper_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_products_to_categories" ADD CONSTRAINT "tonytonyshopper_products_to_categories_productId_tonytonyshopper_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."tonytonyshopper_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_products_to_categories" ADD CONSTRAINT "tonytonyshopper_products_to_categories_categoryId_tonytonyshopper_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."tonytonyshopper_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tonytonyshopper_session" ADD CONSTRAINT "tonytonyshopper_session_userId_tonytonyshopper_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."tonytonyshopper_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "tonytonyshopper_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "comment_product_id_idx" ON "tonytonyshopper_comment" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "comment_parent_id_idx" ON "tonytonyshopper_comment" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "order_item_order_id_idx" ON "tonytonyshopper_order_item" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "variant_product_id_idx" ON "tonytonyshopper_product_variant" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "t_user_id_idx" ON "tonytonyshopper_session" USING btree ("userId");