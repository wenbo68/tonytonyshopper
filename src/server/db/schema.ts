import { relations, sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTableCreator,
  primaryKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `tonytonyshopper_${name}`);

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "cancelled",
  "paid",
  "shipped",
  // "returned",
]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),

  role: userRoleEnum("role").default("user").notNull(),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  reviews: many(comments),
  orders: many(orders),
  cartItems: many(cartItems),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ======== PRODUCTS ========
export const products = createTable("product", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }).notNull(),
  description: d.text(),

  // NEW: Store an array of video URLs
  videos: d.json("videos").$type<string[]>(),

  // MOVED TO VARIANTS: price
  // MOVED TO VARIANTS: images
  // MOVED TO VARIANTS: stock

  // For your "Home page: shows selected products"
  isFeatured: d.boolean("is_featured").default(false).notNull(),

  // --- review denorm fields ---
  averageRating: d.numeric({ precision: 2, scale: 1 }).default("0").notNull(),
  reviewCount: d.integer("review_count").default(0).notNull(),

  // --- variant denorm fields ---
  minPrice: d.numeric({ precision: 10, scale: 2 }).default("0").notNull(),
  maxPrice: d.numeric({ precision: 10, scale: 2 }).default("0").notNull(),
  totalStock: d.integer("total_stock").default(0).notNull(),
  hasOutOfStockVariants: d
    .boolean("has_out_of_stock_variants")
    .default(false)
    .notNull(),

  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const productsRelations = relations(products, ({ many }) => ({
  productsToCategories: many(productsToCategories),
  reviews: many(comments),
  // A product (parent) has many variants
  variants: many(productVariants),
  // cartItems and orderItems are now related to variants, not products
}));

// ======== PRODUCT VARIANTS ========
// Holds the purchasable combinations of options (e.g., "Red, Medium")
export const productVariants = createTable(
  "product_variant",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Link back to the parent product
    productId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    // A display name for this specific variant, e.g., "Red / Medium"
    // You can auto-generate this on the client or server
    name: d.varchar({ length: 255 }),

    // --- MOVED FROM PRODUCTS ---
    price: d.numeric({ precision: 10, scale: 2 }).notNull(),
    images: d.json("images").$type<string[]>(),
    stock: d.integer("stock").default(0).notNull(),

    /**
     * This JSON field stores the options.
     * Example: { "color": "Red", "size": "Medium" }
     */
    options: d.json("options").$type<{ [key: string]: string }>(),
  }),
  (t) => [
    // Index for faster lookups of a product's variants
    index("variant_product_id_idx").on(t.productId),
  ],
);

// --- NEW Relations for ProductVariants ---
export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    // A variant belongs to one product (parent)
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    // A variant can be in many cart items
    cartItems: many(cartItems),
    // A variant can be in many order items
    orderItems: many(orderItems),
  }),
);

// ======== CATEGORIES ========
// For filtering products on your "All page"
export const categories = createTable("category", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }).notNull().unique(),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  productsToCategories: many(productsToCategories),
}));

// ======== PRODUCTS <-> CATEGORIES (Many-to-Many) ========
// A join table to link products to one or more categories
export const productsToCategories = createTable(
  "products_to_categories",
  (d) => ({
    productId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  }),
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] })],
);

export const productsToCategoriesRelations = relations(
  productsToCategories,
  ({ one }) => ({
    category: one(categories, {
      fields: [productsToCategories.categoryId],
      references: [categories.id],
    }),
    product: one(products, {
      fields: [productsToCategories.productId],
      references: [products.id],
    }),
  }),
);

// ======== REVIEWS (Comments) ========
export const comments = createTable(
  "comment",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    rating: d.integer("rating"), // e.g., 1-5 stars
    text: d.text().notNull(),

    // Links to the user who wrote it
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Links to the product it's for
    productId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    parentId: d
      .varchar({ length: 255 })
      .references((): AnyPgColumn => comments.id, { onDelete: "cascade" }),

    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`),
  }),
  (t) => [
    // Index for faster lookups of a product's reviews
    index("comment_product_id_idx").on(t.productId),
    index("comment_parent_id_idx").on(t.parentId),
  ],
);

// --- Relations for Reviews ---
export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  product: one(products, {
    fields: [comments.productId],
    references: [products.id],
  }),
  // Each reply belongs to one parent comment
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "replies",
  }),
  // Each comment can have many replies
  replies: many(comments, {
    relationName: "replies",
  }),
}));

// ======== CART (for logged-in users) ========
export const cartItems = createTable(
  "cart_item",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // --- UPDATED ---
    // Now references a specific variant, not the parent product
    productVariantId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    // ---

    quantity: d.integer("quantity").default(1).notNull(),

    // --- ADD THIS COLUMN ---
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`),
  }),
  (t) => [
    // A user can only have one row per variant in their cart
    primaryKey({ columns: [t.userId, t.productVariantId] }),
  ],
);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),

  // --- UPDATED ---
  productVariant: one(productVariants, {
    fields: [cartItems.productVariantId],
    references: [productVariants.id],
  }),
}));

// ======== ORDERS ========
// The main record of a completed purchase
export const orders = createTable("order", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Nullable, to support GUEST checkout
  userId: d.varchar({ length: 255 }).references(() => users.id),

  // Required if userId is null
  guestEmail: d.varchar({ length: 255 }),

  status: orderStatusEnum("status").notNull(),
  totalAmount: d.numeric({ precision: 10, scale: 2 }).notNull(),

  // Store shipping/billing address as JSON for simplicity
  // This is safer, as the address is "frozen in time" for this order
  shippingAddress: d.json("shipping_address"),
  billingAddress: d.json("billing_address"),

  // Store the Stripe Payment Intent ID for reconciliation
  paymentIntentId: d.varchar({ length: 255 }).unique(),

  // Shipping info
  carrier: d.varchar("carrier", { length: 50 }), // e.g., "USPS", "FedEx"
  trackingNumber: d.varchar("tracking_number", { length: 255 }),

  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  // An order can belong to one user (or null)
  user: one(users, { fields: [orders.userId], references: [users.id] }),

  // An order has many items
  orderItems: many(orderItems),
}));

// ======== ORDER ITEMS (Line Items) ========
export const orderItems = createTable(
  "order_item",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    // --- UPDATED ---
    // Now references a specific variant
    productVariantId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => productVariants.id), // Don't cascade
    // ---

    quantity: d.integer("quantity").notNull(),
    priceAtPurchase: d.numeric({ precision: 10, scale: 2 }).notNull(),
  }),
  (t) => [index("order_item_order_id_idx").on(t.orderId)],
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),

  // --- UPDATED ---
  productVariant: one(productVariants, {
    fields: [orderItems.productVariantId],
    references: [productVariants.id],
  }),
}));
