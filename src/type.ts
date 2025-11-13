import z from "zod";
import { products, productVariants, type comments } from "./server/db/schema";

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
