"use client";

import { useProductFilterContext } from "~/app/_contexts/filter/ProductFilterProvider";
import DropdownFilter from "../DropdownFilter";
import { productSortOptions } from "~/const";
import type { FilterOption } from "~/type";
import { IoIosArrowDown } from "react-icons/io";
import { useSessionStorageState } from "~/app/_hooks/useSessionStorage";
import TextFilter from "../TextFilter";

export default function ProductFilters({
  categoryOptions,
}: {
  categoryOptions: FilterOption[];
}) {
  const [isFilterVisible, setIsFilterVisible] = useSessionStorageState(
    "isFilterVisible",
    false,
  );

  const {
    name,
    category,
    priceMin,
    priceMax,
    ratingMin,
    ratingMax,
    stock,
    sort,
    setName,
    setCategory,
    setPriceMin,
    setPriceMax,
    setRatingMin,
    setRatingMax,
    setStock,
    setSort,
    handleSearch,
  } = useProductFilterContext();

  const stockOptions: FilterOption[] = [
    { label: "No options have stock", urlInput: "none" },
    { label: "Some options have stock", urlInput: "some" },
    { label: "All options have stock", urlInput: "all" },
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <form
      id="product-filters"
      onSubmit={handleSubmit}
      className="grid w-full grid-cols-2 gap-2 text-sm sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 lg:gap-5 xl:grid-cols-5 xl:gap-6"
    >
      {/* Order ID with Mobile Toggle Action */}
      <div className="col-span-2 sm:col-span-1">
        <TextFilter
          label="Product Name"
          inputs={[
            {
              value: name,
              placeholder: "Enter ID...",
              onChange: (val) => {
                setName(val);
                handleSearch({ name: val });
              },
            },
          ]}
          action={
            <button
              type="button"
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className="cursor-pointer rounded bg-gray-900 p-2 sm:hidden"
            >
              <IoIosArrowDown
                className={`h-5 w-5 transform transition-transform duration-200 ${
                  isFilterVisible ? "rotate-180" : ""
                }`}
              />
            </button>
          }
        />
      </div>

      {/* Filter Components */}
      <div className={`${isFilterVisible ? "contents" : "hidden"} sm:contents`}>
        <DropdownFilter
          label="Category"
          options={categoryOptions}
          isGroupOptions={false}
          value={category}
          onChange={setCategory}
          mode="multi"
        />
        <DropdownFilter
          label="Stock"
          options={stockOptions}
          isGroupOptions={false}
          value={stock}
          onChange={setStock}
          mode="multi"
        />

        {/* Grand Total - Two Inputs */}
        <TextFilter
          label="Price"
          inputs={[
            {
              value: priceMin,
              placeholder: "Min",
              type: "number",
              min: 0,
              onChange: (val) => {
                setPriceMin(val);
                handleSearch({ priceMin: val });
              },
            },
            {
              value: priceMax,
              placeholder: "Max",
              type: "number",
              min: 0,
              onChange: (val) => {
                setPriceMax(val);
                handleSearch({ priceMax: val });
              },
            },
          ]}
        />

        {/* Grand Total - Two Inputs */}
        <TextFilter
          label="Rating"
          inputs={[
            {
              value: ratingMin,
              placeholder: "Min",
              type: "number",
              min: 0,
              onChange: (val) => {
                setRatingMin(val);
                handleSearch({ ratingMin: val });
              },
            },
            {
              value: ratingMax,
              placeholder: "Max",
              type: "number",
              min: 0,
              onChange: (val) => {
                setRatingMax(val);
                handleSearch({ ratingMax: val });
              },
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
      </div>
    </form>
  );
}
