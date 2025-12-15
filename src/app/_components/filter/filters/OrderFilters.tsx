"use client";

import { useState } from "react";
import { useOrderFilterContext } from "~/app/_contexts/filter/OrderFilterProvider";
import DropdownFilter from "../DropdownFilter";
import type { FilterOption } from "~/type";
import { IoIosArrowDown } from "react-icons/io";
import TextFilter from "../TextFilter";
import { isValidDate } from "~/server/utils/generic";
import { orderSortOptions } from "~/const";

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
    sort,
    setSort,
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
      id="order-filters"
      onSubmit={handleSubmit}
      className="grid w-full grid-cols-2 gap-2 text-sm sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 lg:gap-5 xl:grid-cols-5 xl:gap-6"
    >
      {/* Order ID with Mobile Toggle Action */}
      <div className="col-span-2 sm:col-span-1">
        <TextFilter
          label="Order ID"
          inputs={[
            {
              value: id,
              placeholder: "Enter ID...",
              onChange: (val) => {
                setId(val);
                handleSearch({ id: val });
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

      {/* Collapsible Filters */}
      <div className={`${isFilterVisible ? "contents" : "hidden"} sm:contents`}>
        {/* Date Range */}
        <TextFilter
          label="Date: yyyy/mm/dd"
          inputs={[
            {
              value: dateMin,
              placeholder: "Start",
              onChange: (val) => {
                setDateMin(val);
                if (isValidDate(val)) handleSearch({ dateMin: val });
              },
            },
            {
              value: dateMax,
              placeholder: "End",
              onChange: (val) => {
                setDateMax(val);
                if (isValidDate(val)) handleSearch({ dateMax: val });
              },
            },
          ]}
        />

        {/* Grand Total - Two Inputs */}
        <TextFilter
          label="Total"
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

        {/* Status Filter */}
        <DropdownFilter
          label="Status"
          options={statusOptions}
          isGroupOptions={false}
          value={status}
          onChange={setStatus}
          mode="multi"
        />

        <TextFilter
          label="Delivery"
          inputs={[
            {
              value: carrier,
              placeholder: "Carrier",
              onChange: (val) => {
                setCarrier(val);
                handleSearch({ carrier: val });
              },
            },
            {
              value: trackingNumber,
              placeholder: "Tracking",
              onChange: (val) => {
                setTrackingNumber(val);
                handleSearch({ trackingNumber: val });
              },
            },
          ]}
        />

        <DropdownFilter
          label="Sort By"
          options={orderSortOptions}
          isGroupOptions={true}
          value={sort}
          onChange={setSort}
          mode="single"
        />
      </div>
    </form>
  );
}
