"use client";

import { useProductFilterContext } from "~/app/_contexts/filter/ProductFilterProvider";
import { productSortOptions } from "~/const";
import type { FilterOption } from "~/type";
import { GenericFilters, type FilterConfig } from "./GenericFilters";

const stockOptions: FilterOption[] = [
  { label: "No options have stock", urlInput: "none" },
  { label: "Some options have stock", urlInput: "some" },
  { label: "All options have stock", urlInput: "all" },
];

export default function ProductFilters({
  categoryOptions,
}: {
  categoryOptions: FilterOption[];
}) {
  const context = useProductFilterContext();

  const fields: FilterConfig<typeof context.filters>[] = [
    {
      type: "text",
      key: "name", // Unique ID for React Key
      label: "Product Name",
      inputs: [{ key: "name", type: "text", placeholder: "Enter Name..." }],
    },
    {
      type: "dropdown",
      key: "category",
      label: "Category",
      options: categoryOptions,
      isGroupOptions: false,
      mode: "multi",
    },
    {
      type: "dropdown",
      key: "stock",
      label: "Stock",
      options: stockOptions,
      isGroupOptions: false,
      mode: "multi",
    },
    {
      type: "text",
      key: "price",
      label: "Price",
      inputs: [
        { key: "priceMin", placeholder: "Min", type: "number", min: 0 },
        { key: "priceMax", placeholder: "Max", type: "number", min: 0 },
      ],
    },
    {
      type: "text",
      key: "rating",
      label: "Rating",
      inputs: [
        { key: "ratingMin", placeholder: "Min", type: "number", min: 0 },
        { key: "ratingMax", placeholder: "Max", type: "number", min: 0 },
      ],
    },
  ];

  return (
    <GenericFilters
      id="product-filters"
      context={context}
      filterConfigs={fields}
      mainFilterKey="name" // This makes 'name' the visible mobile input
      sortOptions={productSortOptions}
    />
  );
}
