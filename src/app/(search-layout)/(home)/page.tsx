"use client";

import { ItemGrid, itemGridClassName } from "~/app/_components/item/ItemGrid";
import { api } from "~/trpc/react";
import { ItemCard } from "~/app/_components/item/ItemCard";
import {
  circButtonClass,
  overlayPositionClasses,
  OverlayTag,
} from "~/app/_components/item/ItemImageOverlays";
import { FaCartPlus, FaStar } from "react-icons/fa";
import { formatCurrency, formatNumber } from "~/server/utils/product";
import { AddToCartButton } from "~/app/_components/button/AddToCartButton";
import Link from "next/link";

export default function ProductsPage() {
  const utils = api.useUtils();
  const prefetchProductDetails = (productId: string) => {
    void utils.product.getById.prefetch({ id: productId });
  };

  // 4. Use the `useQuery` hook, but only enable it if parsing succeeded
  const { data, isPending } = api.product.getHomeProducts.useQuery();

  // 5. Show a skeleton while fetching new data
  const skeletonCount = 4;

  if (isPending) {
    return (
      // <ItemGridSkeleton
      //   gridClasses={itemGridClassName}
      //   skeletonCount={skeletonCount}
      //   classNames={[
      //     "w-4/5 text-sm min-h-[calc(1.5em-0.25rem)]",
      //     "w-3/5 text-sm min-h-[calc(1.5em-0.25rem)]",
      //   ]}
      // />
      <div className="animate-pulse text-center">Loading products...</div>
    );
  }

  // 6. Render the results
  if (data)
    return (
      <>
        {data.map((category) => (
          <div
            key={category.id}
            className="flex flex-col gap-2 sm:gap-3 md:gap-4 lg:gap-5"
          >
            {/* label & link */}
            <div className="flex items-end justify-between">
              <span className="font-bold text-gray-300 uppercase">
                {category.name}
              </span>
              <Link
                href={`/search?category=${category.id}&sort=rating-desc`}
                className="text-xs font-semibold text-gray-500 transition hover:text-blue-500"
              >
                View All
              </Link>
            </div>
            {/* products */}
            <ItemGrid>
              {category.products.map((product) => {
                const imageUrl =
                  product.imageUrl ??
                  "https://placehold.co/600x600/eee/ccc.png?text=No+Image";

                const numericRating = parseFloat(product.averageRating);

                return (
                  <div
                    key={product.id}
                    onMouseEnter={(e) => prefetchProductDetails(product.id)}
                    onFocus={(e) => prefetchProductDetails(product.id)}
                  >
                    <ItemCard
                      image={{
                        src: imageUrl,
                        alt: product.name,
                        href: `/product/${product.id}`,
                      }}
                      overlays={
                        <>
                          {/* Rating Tag */}
                          <OverlayTag position="topLeft">
                            <div className="flex items-center gap-0.5">
                              <FaStar
                                className="relative bottom-px text-yellow-500/80"
                                size={12}
                              />
                              <div className="flex items-center gap-px">
                                <span className="">
                                  {numericRating.toFixed(1)}
                                </span>
                                <span className="">
                                  ({formatNumber(product.reviewCount)})
                                </span>
                              </div>
                            </div>
                          </OverlayTag>

                          {/* Add to Cart Button */}
                          <AddToCartButton
                            product={product.id}
                            className={`${circButtonClass} ${overlayPositionClasses.topRight}`}
                          >
                            <FaCartPlus className="" size={14} />
                          </AddToCartButton>

                          {/* Price Tag */}
                          <OverlayTag position="bottomLeft">
                            <span className="font-semibold">
                              {product.minPrice === product.maxPrice
                                ? formatCurrency(product.minPrice)
                                : `From ${formatCurrency(product.minPrice)}`}
                            </span>
                          </OverlayTag>
                        </>
                      }
                    >
                      <Link
                        href={`/product/${product.id}`}
                        className="line-clamp-2 min-h-[3em] text-sm leading-normal font-semibold hover:text-blue-400"
                      >
                        {product.name}
                      </Link>
                    </ItemCard>
                  </div>
                );
              })}
            </ItemGrid>
          </div>
        ))}
      </>
    );

  return (
    <div className="flex flex-col gap-0">
      <h2 className="text-center font-bold">No products found!</h2>
      <p className="text-center text-sm">Please check back later.</p>
    </div>
  );
}
