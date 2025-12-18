function ItemCardSkeleton({ classNames }: { classNames: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {/* Image Skeleton */}
      <div className="aspect-square w-full animate-pulse rounded bg-gray-800" />

      {/* Caption Skeleton(s) */}
      <div className="flex flex-col gap-1">
        {classNames.map((s, i) => (
          <div
            key={i}
            className={`animate-pulse rounded bg-gray-800 leading-normal ${s ?? ""}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function ItemGridSkeleton({
  gridClasses,
  skeletonCount,
  classNames,
}: {
  gridClasses: string;
  skeletonCount: number;
  classNames: string[];
}) {
  return (
    <div className={gridClasses}>
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <ItemCardSkeleton key={index} classNames={classNames} />
      ))}
    </div>
  );
}
