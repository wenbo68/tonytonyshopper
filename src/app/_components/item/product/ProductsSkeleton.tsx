import ProductCardSkeleton from "./ProductCardSkeleton";

export default function ProductsSkeleton({
  gridClasses,
  skeletonCount,
}: {
  gridClasses: string;
  skeletonCount: number;
}) {
  return (
    <div className={gridClasses}>
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
