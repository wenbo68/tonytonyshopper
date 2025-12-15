'use client';

import { api } from '~/trpc/react';
import StarRating from './StarRating';
import { useProductContext } from '~/app/_contexts/ProductProvider';

export default function AvgRating(
  {
    //   productId
    // }: {
    //   productId: string
  }
) {
  const { productId } = useProductContext();

  // 4. Pass the productId as input
  const { data: ratingData, isPending } = api.comment.getAverageRating.useQuery(
    { productId }
  );

  // Optional: Show a skeleton loader while fetching
  if (isPending && productId) {
    return (
      <div className="flex flex-col items-center animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-5 w-24 rounded bg-gray-800"></div>
          {/* Star skeleton */}
          <div className="h-5 w-8 rounded bg-gray-800"></div>
          {/* Rating skeleton */}
        </div>
        <div className="h-5 w-16 rounded bg-gray-800"></div>
        {/* Count skeleton */}
      </div>
    );
  }

  // Don't render anything if the query hasn't run or has no data
  if (!ratingData) return null;

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
