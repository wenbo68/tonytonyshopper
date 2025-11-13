"use client";

import { api } from "~/trpc/react";
import SeedButton from "../../_components/SeedButton";
import ProductCard from "~/app/_components/product/ProductCard";
import ProductCardSkeleton from "~/app/_components/product/ProductCardSkeleton";

export default function ProductPage() {
  // 1. Fetch data
  const { data: products, isPending } = api.product.getAll.useQuery();

  // Number of skeletons to show while loading
  const skeletonCount = 5;

  // The grid layout classes, extracted to be reusable
  const gridClasses =
    "grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

  return (
    <div className="flex flex-col gap-5">
      <SeedButton />

      {/* 1. Loading State */}
      {isPending && (
        <div className={gridClasses}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* 2. Empty State */}
      {!isPending && (!products || products.length === 0) && (
        <p>No products found. Please check back later!</p>
      )}

      {/* 3. Data State */}
      {!isPending && products && products.length > 0 && (
        <div className={gridClasses}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
