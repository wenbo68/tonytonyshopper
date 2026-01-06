"use client"; // 1. Make this a Client Component

// import ReviewFilters from "../filter/filters/ReviewFilters";
import AvgRating from "./rating/AvgRating";
// import ReviewFilterPills from "../filter/filterPills/ReviewFilterPills";
import Comments from "./Comments";
// import { ReviewFilterProvider } from "~/app/_contexts/filter/ReviewFilterProvider";
import { useProductContext } from "~/app/_contexts/ProductProvider";
import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { GetCommentTreeInputSchema } from "~/type";

export default function RatingAndCommentSection() {
  const { productId } = useProductContext();

  const { data: ratingData, isPending: isRatingDataPending } =
    api.comment.getAverageRating.useQuery({ productId });

  // 1. Get input from url (zod optional doesn't accept null so must use undefined)
  const searchParams = useSearchParams();
  const rating = searchParams.getAll("rating").map(Number);
  const sort = searchParams.get("sort") ?? undefined;
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1; // must not let it default to 0 when page is empty string

  // 2. Construct the tRPC input object from the context state
  const rawInput = {
    productId,
    rating,
    sort,
    page,
    pageSize: 10,
  };

  // 3. Validate the raw input using the shared schema
  const parsedInput = GetCommentTreeInputSchema.safeParse(rawInput);

  // 4. if invalid input, don't call trpc procedure
  if (!parsedInput.success) {
    // You can optionally render an error state if the filters are somehow invalid
    console.error("Zod validation failed:", parsedInput.error);
    return (
      <p className="font-semibold text-gray-300">Invalid search options.</p>
    );
  }

  // 5. call procedure to fetch data
  const { data: commentData, isPending: isCommentDataPending } =
    api.comment.getCommentTree.useQuery(
      parsedInput.success ? parsedInput.data : (undefined as any),
      {
        enabled: parsedInput.success,
        // staleTime: 0,
        // refetchOnWindowFocus: false,
      },
    );

  const isPending = isRatingDataPending || isCommentDataPending;

  if (isPending)
    return (
      <div className="animate-pulse text-center text-gray-300">
        Loading reviews...
      </div>
    );

  return (
    <section className="flex flex-col gap-5 sm:gap-7">
      <AvgRating ratingData={ratingData} />
      <Comments commentData={commentData} page={page} />
      {/* <WriteReview /> */}
    </section>
  );
}
