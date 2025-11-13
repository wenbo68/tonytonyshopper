export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {/* Image Skeleton */}
      <div className="aspect-square w-full animate-pulse rounded bg-gray-800" />

      {/* Text Skeletons */}
      <div className="flex flex-col gap-2">
        {/* Name Skeleton */}
        <div className="h-5 w-3/4 animate-pulse rounded bg-gray-800" />
        {/* Price Skeleton */}
        <div className="h-5 w-1/2 animate-pulse rounded bg-gray-800" />
      </div>
    </div>
  );
}
