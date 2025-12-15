"use client";

import { useState } from "react";
import { useAdminOrderFilterContext } from "~/app/_contexts/AdminOrderFilterProvider";
import type { FilterOption } from "~/type";
import { IoIosArrowDown } from "react-icons/io";
import DropdownFilter from "../../filter/DropdownFilter";
import TextFilter from "../../filter/TextFilter"; // Adjust path as needed
import { adminOrderSortOptions } from "~/const";
import { isValidDate } from "~/server/utils/generic";

export default function AdminOrderFilters() {
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const {
    id,
    setId,
    dateMin,
    setDateMin,
    dateMax,
    setDateMax,
    customerName,
    setCustomerName,
    customerEmail,
    setCustomerEmail,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    status,
    setStatus,
    carrier,
    setCarrier,
    trackingNumber,
    setTrackingNumber,
    sort,
    setSort,
    handleSearch,
  } = useAdminOrderFilterContext();

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
      id="admin-order-filters"
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

      {/* Collapsible Section */}
      <div className={`${isFilterVisible ? "contents" : "hidden"} sm:contents`}>
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

        <TextFilter
          label="Customer"
          inputs={[
            {
              value: customerName,
              placeholder: "Name",
              onChange: (val) => {
                setCustomerName(val);
                handleSearch({ customerName: val });
              },
            },
            {
              value: customerEmail,
              placeholder: "Email",
              onChange: (val) => {
                setCustomerEmail(val);
                handleSearch({ customerEmail: val });
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
          options={adminOrderSortOptions}
          isGroupOptions={true}
          value={sort}
          onChange={setSort}
          mode="single"
        />
      </div>
    </form>
  );
}
