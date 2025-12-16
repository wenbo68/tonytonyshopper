"use client";

import { useProductFilterContext } from "~/app/_contexts/filter/ProductFilterProvider";
import DropdownFilter from "../DropdownFilter";
import TextFilter from "../TextFilter";
import { productSortOptions } from "~/const";
import type { FilterOption } from "~/type";
import { FilterLayout } from "../FilterLayout";

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
  const { filters, setFilter, sort, setSort, handleSearch } =
    useProductFilterContext();

  // Helper to reduce boilerplate
  // This updates local state AND triggers the search immediately
  const update = <K extends keyof typeof filters>(
    key: K,
    val: (typeof filters)[K],
  ) => {
    setFilter(key, val);
    handleSearch({ [key]: val } as any);
  };

  return (
    <FilterLayout
      id="product-filters"
      onSubmit={() => handleSearch()}
      mainFilter={({ toggleAction }) => (
        <TextFilter
          label="Product Name"
          inputs={[
            {
              value: filters.name,
              placeholder: "Enter Name...",
              onChange: (val) => update("name", val),
            },
          ]}
          action={toggleAction}
        />
      )}
      expandableFilters={
        <>
          <DropdownFilter
            label="Category"
            options={categoryOptions}
            isGroupOptions={false}
            value={filters.category}
            onChange={(val) => setFilter("category", val)}
            mode="multi"
          />
          <DropdownFilter
            label="Stock"
            options={stockOptions}
            isGroupOptions={false}
            value={filters.stock}
            onChange={(val) => setFilter("stock", val)}
            mode="multi"
          />
          <TextFilter
            label="Price"
            inputs={[
              {
                value: filters.priceMin,
                placeholder: "Min",
                type: "number",
                min: 0,
                onChange: (val) => update("priceMin", val),
              },
              {
                value: filters.priceMax,
                placeholder: "Max",
                type: "number",
                min: 0,
                onChange: (val) => update("priceMax", val),
              },
            ]}
          />
          <TextFilter
            label="Rating"
            inputs={[
              {
                value: filters.ratingMin,
                placeholder: "Min",
                type: "number",
                min: 0,
                onChange: (val) => update("ratingMin", val),
              },
              {
                value: filters.ratingMax,
                placeholder: "Max",
                type: "number",
                min: 0,
                onChange: (val) => update("ratingMax", val),
              },
            ]}
          />
          <DropdownFilter
            label="Sort By"
            options={productSortOptions}
            isGroupOptions={true}
            value={sort}
            onChange={setSort}
            mode="single"
          />
        </>
      }
    />
  );
}
