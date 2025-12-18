import z from "zod";
import {
  orderItems,
  orders,
  products,
  productVariants,
  type comments,
} from "./server/db/schema";
import type { colorClassMap } from "./const";

// ==================================
// Backend Types
// ==================================

// ==== comments ====
export type FlatCommentWithUser = typeof comments.$inferSelect & {
  userName: string | null;
  userImage: string | null;
};
export type CommentAndUser = typeof comments.$inferSelect & {
  user: {
    name: string | null;
    image: string | null;
  };
};
export type CommentTree = CommentAndUser & {
  replies: CommentTree[];
};

// ==== product & variant ====
export type Variant = typeof productVariants.$inferSelect;
export type ProductAndVariants = typeof products.$inferSelect & {
  variants: Variant[];
};
export type VariantAndProduct = typeof productVariants.$inferSelect & {
  product: ProductAndVariants;
};

// ==== stock ====
export const StockEnum = z.enum(["all", "some", "none"]);
export type StockEnum = z.infer<typeof StockEnum>;

// ==== orders ====
export type OrderItemAndVariantAndProduct = typeof orderItems.$inferSelect & {
  variant: VariantAndProduct;
};
export type OrderAndOrderItemsAndVariantAndProduct =
  typeof orders.$inferSelect & {
    orderItems: OrderItemAndVariantAndProduct[];
  };

// ==== search input schemas ====
export const getAllOrdersInputSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(50).optional().default(20),

  id: z.string().optional(),
  dateMin: z.string().optional(),
  dateMax: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  itemsMin: z.number().min(0).optional(),
  itemsMax: z.number().min(0).optional(),
  itemName: z.string().optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  status: z
    .array(z.enum(["pending", "paid", "shipped", "cancelled"]))
    .optional(),
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),

  sort: z
    .enum([
      "date-desc",
      "date-asc",
      "price-desc",
      "price-asc",
      "name-desc",
      "name-asc",
      "email-desc",
      "email-asc",
    ])
    .optional()
    .default("date-desc"),
});
export type GetAllOrdersInput = z.infer<typeof getAllOrdersInputSchema>;

export const getUserOrdersInputSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(50).optional().default(10),

  id: z.string().optional(),
  status: z
    .array(z.enum(["pending", "paid", "shipped", "cancelled"]))
    .optional(),
  dateMin: z.string().optional(),
  dateMax: z.string().optional(),
  itemsMin: z.number().min(0).optional(),
  itemsMax: z.number().min(0).optional(),
  itemName: z.string().optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),

  sort: z
    .enum(["date-desc", "date-asc", "price-desc", "price-asc"])
    .optional()
    .default("date-desc"),
});

export const productSortEnum = z.enum([
  "name-asc",
  "name-desc",
  "price-asc",
  "price-desc",
  "rating-asc",
  "rating-desc",
  "created-asc",
  "created-desc",
]);
export type ProductSortEnum = z.infer<typeof productSortEnum>;

export const getProductsInputSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(50).optional().default(20),

  name: z.string().optional(),
  categories: z.array(z.string()).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  ratingMin: z.number().min(1).max(5).optional(),
  ratingMax: z.number().min(1).max(5).optional(),
  createdMin: z.string().optional(),
  createdMax: z.string().optional(),
  stock: z.array(StockEnum).optional(),

  // Changed from order to sort
  sort: productSortEnum.optional().default("created-desc"),
});

export const GetCommentTreeInputSchema = z.object({
  productId: z.string(),
  rating: z.array(z.number()).optional(),
  // Changed from order to sort
  sort: z.string().optional().default("created-desc"),
  page: z.number().min(1),
  pageSize: z.number().min(1),
});

export type GetCommentTreeInput = z.infer<typeof GetCommentTreeInputSchema>;

// ==================================
// Frontend Types
// ==================================

export type UpdateCommentInput = {
  e: React.FormEvent;
  id: string;
  text: string;
} & (
  | {
      type: "review";
      rating: number;
    }
  | {
      type: "reply";
      rating: undefined;
    }
);

export type FilterOption = { label: string; urlInput: string };
export type FilterGroupOption = { groupLabel: string; options: FilterOption[] };
export type PillConfig = {
  key: string;
  label: string;
  color: keyof typeof colorClassMap;
  onRemove?: () => void;
  className?: string;
};
