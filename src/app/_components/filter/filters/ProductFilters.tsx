"use client";

import { useProductFilterContext } from "~/app/_contexts/filter/ProductFilterProvider";
import { productSortOptions } from "~/const";
import type { FilterOption } from "~/type";
import { GenericFilters, type FilterConfig } from "./GenericFilters";
// import { isValidDate } from "~/server/utils/generic";

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
  const filterContext = useProductFilterContext();

  const filterConfigs: FilterConfig<typeof filterContext.filters>[] = [
    {
      type: "text",
      label: "Product Name",
      inputs: [
        { filterStateName: "name", type: "text", placeholder: "Enter Name..." },
      ],
    },
    {
      type: "dropdown",
      filterStateName: "category",
      label: "Category",
      options: categoryOptions,
      isGroupOptions: false,
      mode: "multi",
    },
    {
      type: "dropdown",
      filterStateName: "stock",
      label: "Stock",
      options: stockOptions,
      isGroupOptions: false,
      mode: "multi",
    },
    {
      type: "text",
      label: "Price",
      inputs: [
        {
          filterStateName: "priceMin",
          placeholder: "Min",
          type: "number",
          min: 0,
        },
        {
          filterStateName: "priceMax",
          placeholder: "Max",
          type: "number",
          min: 0,
        },
      ],
    },
    {
      type: "text",
      label: "Rating",
      inputs: [
        {
          filterStateName: "ratingMin",
          placeholder: "Min",
          type: "number",
          min: 0,
        },
        {
          filterStateName: "ratingMax",
          placeholder: "Max",
          type: "number",
          min: 0,
        },
      ],
    },
    // {
    //   type: "text",
    //   label: "Date: yyyy/mm/dd",
    //   inputs: [
    //     {
    //       filterStateName: "createdMin",
    //       type: "text",
    //       placeholder: "Start",
    //       validate: isValidDate,
    //     },
    //     {
    //       filterStateName: "createdMax",
    //       type: "text",
    //       placeholder: "End",
    //       validate: isValidDate,
    //     },
    //   ],
    // },
  ];

  return (
    <GenericFilters
      id="product-filters"
      context={filterContext}
      filterConfigs={filterConfigs}
      mainFilterKey="Product Name" // This makes 'name' the visible mobile input
      sortOptions={productSortOptions}
    />
  );
}
