"use client";

import { useSearchParams } from "next/navigation";
import { ItemGrid, itemGridClassName } from "~/app/_components/item/ItemGrid";
import PageSelector from "~/app/_components/pagination/Pagination";
import ProductCard from "~/app/_components/product/ProductCard";
import ProductsSkeleton from "~/app/_components/product/ProductsSkeleton";
import { api } from "~/trpc/react";
import { getProductsInputSchema } from "~/type";

export default function ProductsPage() {
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
    stock: stock.length > 0 ? stock : undefined,
    sort,
    page,
    pageSize: 30,
  };

  const parsedInput = getProductsInputSchema.safeParse(rawInput);

  // 4. Use the `useQuery` hook, but only enable it if parsing succeeded
  const { data, isFetching } = api.product.search.useQuery(
    parsedInput.success ? parsedInput.data : (undefined as any),
    {
      enabled: parsedInput.success,
      staleTime: 0,
      refetchOnWindowFocus: false,
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
  const skeletonCount = 5;

  if (isFetching) {
    return (
      <ProductsSkeleton
        gridClasses={itemGridClassName}
        skeletonCount={skeletonCount}
      />
    );
  }

  // 6. Render the results
  if (data && data.products.length > 0) {
    return (
      <div className="flex flex-col gap-6 sm:gap-7 md:gap-8 lg:gap-9 xl:gap-10">
        <ItemGrid>
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
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
    <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6">
      <p className="font-semibold text-gray-300">No results found.</p>
      <p className="text-sm font-semibold">Please check back later!</p>
    </div>
  );
}
