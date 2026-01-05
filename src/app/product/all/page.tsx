"use client";

import { useSearchParams } from "next/navigation";
import ItemGridSkeleton from "~/app/_components/item/ItemGridSkeleton";
import { ItemGrid, itemGridClassName } from "~/app/_components/item/ItemGrid";
import PageSelector from "~/app/_components/pagination/Pagination";
import { api } from "~/trpc/react";
import { getProductsInputSchema } from "~/type";
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
  const prefetchProduct = (productId: string) => {
    void utils.product.getById.prefetch({ id: productId });
  };

  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? undefined;
  const category = searchParams.getAll("category");
  const priceMin = searchParams.get("priceMin")
    ? Number(searchParams.get("priceMin"))
    : undefined;
  const priceMax = searchParams.get("priceMax")
    ? Number(searchParams.get("priceMax"))
    : undefined;
  const ratingMin = searchParams.get("ratingMin")
    ? Number(searchParams.get("ratingMin"))
    : undefined;
  const ratingMax = searchParams.get("ratingMax")
    ? Number(searchParams.get("ratingMax"))
    : undefined;
  const createdMin = searchParams.get("createdMin") ?? undefined;
  const createdMax = searchParams.get("createdMax") ?? undefined;
  const stock = searchParams.getAll("stock");
  const sort = searchParams.get("sort") ?? undefined;
  const page = searchParams.get("page")
    ? Number(searchParams.get("page"))
    : undefined;

  const rawInput = {
    name,
    category: category.length > 0 ? category : undefined,
    priceMin,
    priceMax,
    ratingMin,
    ratingMax,
    createdMin,
    createdMax,
    stock: stock.length > 0 ? stock : undefined,
    sort,
    page,
    pageSize: 30,
  };

  const parsedInput = getProductsInputSchema.safeParse(rawInput);

  // 4. Use the `useQuery` hook, but only enable it if parsing succeeded
  const { data, isPending } = api.product.searchProducts.useQuery(
    parsedInput.success ? parsedInput.data : (undefined as any),
    {
      enabled: parsedInput.success,
    },
  );

  if (!parsedInput.success) {
    // You can optionally render an error state if the filters are somehow invalid
    console.error("Zod validation failed:", parsedInput.error);
    return (
      <p className="font-semibold text-gray-300">Invalid search options.</p>
    );
  }

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
  if (data && data.products.length > 0) {
    return (
      <div className="flex flex-col gap-6 sm:gap-7 md:gap-8 lg:gap-9 xl:gap-10">
        <ItemGrid>
          {data.products.map((product) => {
            // const variant = product.variants.reduce((prev, curr) =>
            //   parseFloat(curr.price) < parseFloat(prev.price) ? curr : prev,
            // );

            const imageUrl =
              product.imageUrl ??
              "https://placehold.co/600x600/eee/ccc.png?text=No+Image";

            const numericRating = parseFloat(product.averageRating);

            return (
              <div
                key={product.id}
                onMouseEnter={(e) => prefetchProduct(product.id)}
                onFocus={(e) => prefetchProduct(product.id)}
              >
                <ItemCard
                  image={{
                    src: imageUrl,
                    alt: product.name,
                    href: `/product/${product.id}`,
                  }}
                  overlays={
                    <>
                      {/* Edit Button (Admin) */}
                      {/* {session?.user?.role === "admin" && (
                      <OverlayLink
                        href={`/product/edit/${product.id}`}
                        position="topLeft"
                        title="Edit Product"
                      >
                        <FaPen size={12} />
                      </OverlayLink>
                    )} */}

                      {/* Rating Tag */}
                      <OverlayTag position="topLeft">
                        <div className="flex items-center gap-0.5">
                          <FaStar
                            className="relative bottom-px text-yellow-500/80"
                            size={12}
                          />
                          <div className="flex items-center gap-px">
                            <span className="">{numericRating.toFixed(1)}</span>
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
        <PageSelector
          type="product"
          currentPage={page ?? 1}
          totalPages={data.totalPages}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      <h2 className="text-center font-bold">No products found!</h2>
      <p className="text-center text-sm">Please check back later.</p>
    </div>
  );
}
