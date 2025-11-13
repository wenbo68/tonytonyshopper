// src/app/_components/review/reviews/ReviewOrReplyFallback.tsx

export default function ReviewOrReplyFallback() {
  return (
    <div className="bg-gray-900 rounded p-5">
      <div className="flex animate-pulse gap-3">
        {/* Avatar Skeleton */}
        <div className="h-8 w-8 shrink-0 rounded-full bg-gray-800"></div>

        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {/* Username Skeleton */}
              <div className="h-4 w-1/4 rounded bg-gray-800"></div>
              {/* Rating Skeleton */}
              <div className="h-4 w-1/3 rounded bg-gray-800"></div>
            </div>
            {/* Meta (Date/Package) Skeleton */}
            <div className="h-3 w-1/4 rounded bg-gray-800"></div>
          </div>

          {/* Text Content Skeleton */}
          <div className="flex flex-col gap-2">
            <div className="h-4 w-full rounded bg-gray-800"></div>
            <div className="h-4 w-full rounded bg-gray-800"></div>
            {/* <div className="h-4 w-3/4 rounded bg-gray-800"></div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
