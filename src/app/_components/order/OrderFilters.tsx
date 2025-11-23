// src/app/_components/order/OrderFilters.tsx
"use client";

import { useState } from "react";
import { useOrderFilterContext } from "~/app/_contexts/OrderFilterProvider";
import Filter from "../filter/Filter"; // Reuse your existing generic Filter
import type { FilterOption } from "~/type";
import { IoIosArrowDown } from "react-icons/io";
import { IoSearchSharp } from "react-icons/io5";
import { FaXmark } from "react-icons/fa6";

export default function OrderFilters() {
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const {
    id,
    setId,
    status,
    setStatus,
    dateMin,
    setDateMin,
    dateMax,
    setDateMax,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    carrier,
    setCarrier,
    trackingNumber,
    setTrackingNumber,
    handleSearch,
  } = useOrderFilterContext();

  const statusOptions: FilterOption[] = [
    { label: "Paid", urlInput: "paid" },
    { label: "Shipped", urlInput: "shipped" },
    { label: "Cancelled", urlInput: "cancelled" },
    { label: "Pending", urlInput: "pending" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid w-full grid-cols-2 gap-2 text-sm sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 lg:gap-5 xl:grid-cols-6 xl:gap-6"
    >
      {/* Order ID Search */}
      <div className="col-span-2 flex w-full flex-col gap-2 sm:col-span-2 lg:col-span-2">
        <span className="w-full font-semibold">Order ID</span>
        <div className="flex w-full items-center gap-2">
          <div className="flex w-full items-center rounded bg-gray-900">
            <div className="p-2">
              <IoSearchSharp size={20} />
            </div>
            <input
              type="text"
              placeholder="Search Order ID..."
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                // Optional: debounce this if you want auto-search
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full bg-transparent text-gray-200 outline-none"
            />
            {id && (
              <button
                type="button"
                onClick={() => {
                  setId("");
                  handleSearch({ id: "" });
                }}
                className="p-2 text-gray-500 hover:text-gray-300"
              >
                <FaXmark size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className="cursor-pointer rounded bg-gray-900 p-2 sm:hidden"
          >
            <IoIosArrowDown
              size={20}
              className={`transition ${isFilterVisible ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Collapsible Filters */}
      <div className={`${isFilterVisible ? "contents" : "hidden"} sm:contents`}>
        {/* Status Filter */}
        <Filter
          label="Status"
          options={statusOptions}
          isGroupOptions={false}
          value={status}
          onChange={setStatus}
          mode="multi"
        />

        {/* Date Range */}
        <div className="col-span-2 flex flex-col gap-2 sm:col-span-2 md:col-span-2 lg:col-span-2">
          <span className="font-semibold">Date Range</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateMin}
              onChange={(e) => setDateMin(e.target.value)}
              className="w-full rounded bg-gray-900 px-3 py-2 text-gray-500 outline-none [&::-webkit-calendar-picker-indicator]:hidden"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={dateMax}
              onChange={(e) => setDateMax(e.target.value)}
              className="w-full rounded bg-gray-900 px-3 py-2 text-gray-500 outline-none [&::-webkit-calendar-picker-indicator]:hidden"
            />
          </div>
        </div>

        {/* Price Range */}
        <div className="flex flex-col gap-2">
          <span className="font-semibold">Total Price</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              min="0"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-full rounded bg-gray-900 px-3 py-2 text-gray-200 outline-none"
            />
            <input
              type="number"
              placeholder="Max"
              min="0"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-full rounded bg-gray-900 px-3 py-2 text-gray-200 outline-none"
            />
          </div>
        </div>

        {/* Extra Text Inputs (Carrier/Tracking) */}
        <div className="flex flex-col gap-2">
          <span className="font-semibold">Carrier</span>
          <input
            type="text"
            placeholder="e.g. FedEx"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="w-full rounded bg-gray-900 px-3 py-2 text-gray-200 outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-semibold">Tracking #</span>
          <input
            type="text"
            placeholder="1Z99..."
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="w-full rounded bg-gray-900 px-3 py-2 text-gray-200 outline-none"
          />
        </div>

        {/* Search Button for explicit submission */}
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Apply
          </button>
        </div>
      </div>
    </form>
  );
}
