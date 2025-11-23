"use client";

import { useProductFilterContext } from "~/app/_contexts/ProductFilterProvider";
import Filter from "../filter/Filter";
import { productOrderOptions } from "~/const";
import type { FilterOption } from "~/type";
import { IoIosArrowDown } from "react-icons/io";
import { IoSearchSharp } from "react-icons/io5";

import { useSessionStorageState } from "~/app/_hooks/useSessionStorage";
import { FaXmark } from "react-icons/fa6";

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
    minPrice,
    maxPrice,
    ratingMin,
    ratingMax,
    stock,
    order,
    setName,
    setCategory,
    setminPrice,
    setmaxPrice,
    setRatingMin,
    setRatingMax,
    setStock,
    setOrder,
    handleSearch,
  } = useProductFilterContext();

  // dropdown options for all filters
  const ratingOptions: FilterOption[] = [
    { label: "1 star", urlInput: "1" },
    { label: "2 star", urlInput: "2" },
    { label: "3 star", urlInput: "3" },
    { label: "4 star", urlInput: "4" },
    { label: "5 star", urlInput: "5" },
  ];

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
      className="grid w-full grid-cols-2 gap-2 text-sm sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 lg:gap-5 xl:grid-cols-6 xl:gap-6"
    >
      <div className="col-span-2 flex w-full flex-col gap-2 sm:col-span-1">
        <span className="w-full font-semibold">Product Name</span>
        <div className="flex w-full items-center gap-2">
          <div className="flex w-full items-center rounded bg-gray-900">
            <div className="p-2">
              <IoSearchSharp size={20} />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                handleSearch({ name: e.target.value });
              }}
              className="w-full outline-none"
            />
            <button
              onClick={() => {
                setName("");
              }}
              className={`cursor-pointer p-2 text-gray-500`}
            >
              <FaXmark size={20} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className="cursor-pointer rounded bg-gray-900 p-2 sm:hidden"
          >
            <IoIosArrowDown size={20} />
          </button>
        </div>
      </div>
      {/* Filter Components */}
      <div className={`${isFilterVisible ? "contents" : "hidden"} sm:contents`}>
        <Filter
          label="Category"
          options={categoryOptions}
          isGroupOptions={false}
          value={category}
          onChange={setCategory}
          mode="multi"
        />
        <Filter
          label="Stock"
          options={stockOptions}
          isGroupOptions={false}
          value={stock}
          onChange={setStock}
          mode="multi"
        />
        {/* Price Filter */}
        <div className="flex flex-col gap-2">
          <span className="font-semibold">Price</span>
          <div className="flex items-center gap-2">
            <div className="flex w-full items-center rounded bg-gray-900 px-3 py-2">
              <input
                type="number"
                placeholder="Min"
                min="0"
                value={minPrice}
                onChange={(e) => setminPrice(e.target.value)}
                onBlur={() => handleSearch()}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full bg-transparent text-gray-200 placeholder-gray-500 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            {/* <span className="text-gray-500">-</span> */}
            <div className="flex w-full items-center rounded bg-gray-900 px-3 py-2">
              <input
                type="number"
                placeholder="Max"
                min="0"
                value={maxPrice}
                onChange={(e) => setmaxPrice(e.target.value)}
                onBlur={() => handleSearch()}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full bg-transparent text-gray-200 placeholder-gray-500 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Rating Filter */}
        <div className="flex flex-col gap-2">
          <span className="font-semibold">Rating</span>
          <div className="flex items-center gap-2">
            <div className="flex w-full items-center rounded bg-gray-900 px-3 py-2">
              <input
                type="number"
                placeholder="Min"
                min="0"
                max="5"
                value={ratingMin}
                onChange={(e) => setRatingMin(e.target.value)}
                onBlur={() => handleSearch()}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full bg-transparent text-gray-300 placeholder-gray-500 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            {/* <span className="text-gray-500">-</span> */}
            <div className="flex w-full items-center rounded bg-gray-900 px-3 py-2">
              <input
                type="number"
                placeholder="Max"
                min="0"
                max="5"
                value={ratingMax}
                onChange={(e) => setRatingMax(e.target.value)}
                onBlur={() => handleSearch()}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full bg-transparent text-gray-300 placeholder-gray-500 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>
        <Filter
          label="Order"
          options={productOrderOptions}
          isGroupOptions={true}
          value={order}
          onChange={setOrder}
          mode="single"
        />
      </div>
    </form>
  );
}
