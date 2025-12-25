"use client";

import { api } from "~/trpc/react";
import StarRating from "./StarRating";
import { useProductContext } from "~/app/_contexts/ProductProvider";

export default function AvgRating() {
  const { productId } = useProductContext();

  const { data: ratingData, isPending } = api.comment.getAverageRating.useQuery(
    { productId },
  );

  if (isPending)
    return <div className="animate-pulse text-center">Loading ratings...</div>;
  if (!ratingData)
    return <div className="text-center">Failed to load ratings.</div>;

  const { averageRating, ratingCount } = ratingData;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        <StarRating
          rating={Number(averageRating.toFixed(1))}
          interactive={false}
        />
        <span className="font-semibold text-gray-300">
          {averageRating.toFixed(1)}
        </span>
      </div>
      <span className="text-sm text-gray-500">{ratingCount} reviews</span>
    </div>
  );
}
