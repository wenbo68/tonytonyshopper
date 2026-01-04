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

  const { averageRating, ratingCount, ratingDistribution } = ratingData;

  // Helper to calculate percentage for the bars
  const getPercentage = (count: number) => {
    if (ratingCount === 0) return 0;
    return (count / ratingCount) * 100;
  };

  return (
    <div className="flex gap-5 sm:gap-7">
      {/* Left: Big Summary */}
      <div className="flex flex-col items-start justify-center gap-2">
        <span className="text-6xl font-semibold text-gray-300">
          {averageRating.toFixed(1)}
        </span>
        <div className="flex flex-col gap-1 px-1">
          <StarRating
            rating={Number(averageRating.toFixed(1))}
            interactive={false}
          />
          <span className="text-xs text-gray-500">
            {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>

      {/* Right: Distribution Bars */}
      <div className="flex flex-1 flex-col gap-px">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count = ratingDistribution[star];
          const percent = getPercentage(count);

          return (
            <div key={star} className="flex items-center gap-3 text-sm">
              {/* Label */}
              <span className="w-3 text-right font-medium text-gray-400">
                {star}
              </span>
              {/* Star Icon (Optional, or just keep the number) */}
              {/* <span className="text-gray-500">★</span> */}

              {/* Bar Background */}
              <div className="h-2.5 flex-1 overflow-hidden rounded bg-gray-800">
                {/* Filled Bar */}
                <div
                  className="h-full bg-violet-400 transition-all duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Count */}
              {/* <span className="w-8 text-right text-gray-400">{count}</span> */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
