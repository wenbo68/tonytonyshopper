"use client";

import { useProductFilterContext } from "~/app/_contexts/filter/ProductFilterProvider";
import { productSortOptions } from "~/const";
import type { FilterOption } from "~/type";
import { GenericFilterPills, type PillDefinition } from "../GenericFilterPills";
// import { GenericFilterPills, type PillDefinition } from "./GenericFilterPills";

export default function ProductFilterPills({
  categoryOptions,
}: {
  categoryOptions: FilterOption[];
}) {
  const context = useProductFilterContext();

  const definitions: Partial<
    Record<keyof typeof context.filters, PillDefinition<any>>
  > = {
    name: { label: (val) => `Name: ${val}`, color: 1 },
    category: {
      label: (val) => {
        const match = categoryOptions.find((opt) => opt.urlInput === val);
        return `Category: ${match ? match.label : val}`;
      },
      color: 2,
    },
    stock: { label: (val) => `Stock: ${val}`, color: 3 },
    priceMin: { label: (val) => `Price Min: ${val}`, color: 4 },
    priceMax: { label: (val) => `Price Max: ${val}`, color: 4 },
    ratingMin: { label: (val) => `Rating Min: ${val}`, color: 5 },
    ratingMax: { label: (val) => `Rating Max: ${val}`, color: 5 },
  };

  return (
    <GenericFilterPills
      context={context}
      definitions={definitions}
      sortOptions={productSortOptions}
    />
  );
}
