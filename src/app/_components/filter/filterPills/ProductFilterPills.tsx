"use client";

// 1. Import usePathname
import { usePathname } from "next/navigation";
import { useProductFilterContext } from "~/app/_contexts/filter/ProductFilterProvider";
import { productSortOptions } from "~/const";
import type { FilterOption } from "~/type";
import { GenericFilterPills, type BasePillConfig } from "./GenericFilterPills";

export default function ProductFilterPills({
  categoryOptions,
}: {
  categoryOptions: FilterOption[];
}) {
  // 2. Get the current pathname
  const pathname = usePathname();
  const context = useProductFilterContext();

  // 3. Return null if we are not on the search page
  // (Assuming your search page route is "/search")
  if (pathname === "/") {
    return null;
  }

  const definitions: Partial<
    Record<keyof typeof context.filters, BasePillConfig<any>>
  > = {
    name: { getLabelFromFilterState: (val) => `Name: ${val}`, color: 1 },
    category: {
      getLabelFromFilterState: (val) => {
        const match = categoryOptions.find((opt) => opt.urlInput === val);
        return `Category: ${match ? match.label : val}`;
      },
      color: 2,
    },
    stock: { getLabelFromFilterState: (val) => `Stock: ${val}`, color: 3 },
    priceMin: {
      getLabelFromFilterState: (val) => `Price Min: ${val}`,
      color: 4,
    },
    priceMax: {
      getLabelFromFilterState: (val) => `Price Max: ${val}`,
      color: 4,
    },
    ratingMin: {
      getLabelFromFilterState: (val) => `Rating Min: ${val}`,
      color: 5,
    },
    ratingMax: {
      getLabelFromFilterState: (val) => `Rating Max: ${val}`,
      color: 5,
    },
  };

  return (
    <GenericFilterPills
      context={context}
      basePillConfigs={definitions}
      sortOptions={productSortOptions}
    />
  );
}
