"use client";

import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { getAllProductsInputSchema } from "~/type";
import ProductsSkeleton from "./ProductsSkeleton";
import ProductCard from "./ProductCard";
import PageSelector from "../pagination/Pagination";

export default function Products() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? undefined;
  const category = searchParams.getAll("category");
  const minPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : undefined;
  const maxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : undefined;
  const maxRating = searchParams.get("maxRating")
    ? Number(searchParams.get("maxRating"))
    : undefined;
  const minRating = searchParams.get("minRating")
    ? Number(searchParams.get("minRating"))
    : undefined;
  const stock = searchParams.getAll("stock");
  const order = searchParams.get("order") ?? undefined;
  const page = searchParams.get("page")
    ? Number(searchParams.get("page"))
    : undefined;

  const rawInput = {
    name,
    category: category.length > 0 ? category : undefined,
    minPrice,
    maxPrice,
    minRating,
    maxRating,
    stock: stock.length > 0 ? stock : undefined,
    order,
    page,
    pageSize: 30,
  };

  const parsedInput = getAllProductsInputSchema.safeParse(rawInput);

  // 4. Use the `useQuery` hook, but only enable it if parsing succeeded
  const { data, isFetching } = api.product.search.useQuery(
    parsedInput.success ? parsedInput.data : (undefined as any),
    {
      enabled: parsedInput.success,
      staleTime: 0, // always refetch immediately on input change
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
  const gridClasses =
    "grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

  if (isFetching) {
    return (
      <ProductsSkeleton
        gridClasses={gridClasses}
        skeletonCount={skeletonCount}
      />
    );
  }

  // 6. Render the results
  if (data && data.products.length > 0) {
    // const pageMediaIds = data.pageMedia.map((m) => m.media.id);
    // const uniquePageMediaIds = [...new Set(pageMediaIds)];

    return (
      <div className="flex flex-col gap-6 sm:gap-7 md:gap-8 lg:gap-9 xl:gap-10">
        <div className={gridClasses}>
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
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
      <p className="text-sm font-semibold">
        No products found. Please check back later!
      </p>
    </div>
  );
}
