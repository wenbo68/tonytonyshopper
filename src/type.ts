import z from "zod";
import { products, productVariants, type comments } from "./server/db/schema";

export const StockEnum = z.enum(["all", "some", "none"]);
export type StockEnum = z.infer<typeof StockEnum>;

export const productOrderEnum = z.enum([
  "name-asc",
  "name-desc",
  "price-asc",
  "price-desc",
  "rating-asc",
  "rating-desc",
  "created-asc",
  "created-desc",
]);
export type ProductOrderEnum = z.infer<typeof productOrderEnum>;

// --- NEW Zod Schema for getAll input ---
export const getAllProductsInputSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(50).optional().default(20),

  // Filters
  name: z.string().optional(),
  categories: z.array(z.string()).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  ratingMin: z.number().min(1).max(5).optional(),
  ratingMax: z.number().min(1).max(5).optional(),
  stock: z.array(StockEnum).optional(),

  // Sorting
  order: productOrderEnum.optional().default("created-desc"),
  // sortKey: z
  //   .enum(["date", "name", "price", "rating"])
  //   .optional()
  //   .default("date"),
  // sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// product and its associated variants
export type Variants = typeof productVariants.$inferSelect;
export type ProductAndVariants = typeof products.$inferSelect & {
  variants: Variants[];
};

// input type of getCommentTree procedure
export const GetCommentTreeInputSchema = z.object({
  productId: z.string(),
  rating: z.array(z.number()).optional(),
  order: z.string().optional().default("created-desc"),
  page: z.number().min(1),
  pageSize: z.number().min(1),
});

export type GetCommentTreeInput = z.infer<typeof GetCommentTreeInputSchema>;

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
// return type of getCommentTree procedure
export type CommentTree = CommentAndUser & {
  replies: CommentTree[];
};

// used for handleUpdate() when clicking edit on review/reply
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

// comment filter types
export type FilterOption = { label: string; urlInput: string };
export type FilterGroupOption = { groupLabel: string; options: FilterOption[] };
