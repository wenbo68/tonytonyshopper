"use client";

import { useOrderFilterContext } from "~/app/_contexts/filter/OrderFilterProvider";
import DropdownFilter from "../DropdownFilter";
import TextFilter from "../TextFilter";
import { orderSortOptions } from "~/const";
import { isValidDate } from "~/server/utils/generic";
import type { FilterOption } from "~/type";
import { FilterLayout } from "../FilterLayout";

const statusOptions: FilterOption[] = [
  { label: "Paid", urlInput: "paid" },
  { label: "Shipped", urlInput: "shipped" },
  { label: "Cancelled", urlInput: "cancelled" },
  { label: "Pending", urlInput: "pending" },
];

export default function OrderFilters() {
  const { filters, setFilter, sort, setSort, handleSearch } =
    useOrderFilterContext();

  const update = <K extends keyof typeof filters>(
    key: K,
    val: (typeof filters)[K],
  ) => {
    setFilter(key, val);
    handleSearch({ [key]: val } as any);
  };

  return (
    <FilterLayout
      id="order-filters"
      onSubmit={() => handleSearch()}
      mainFilter={({ toggleAction }) => (
        <TextFilter
          label="Order ID"
          inputs={[
            {
              value: filters.id,
              placeholder: "Enter ID...",
              onChange: (val) => update("id", val),
            },
          ]}
          action={toggleAction}
        />
      )}
      expandableFilters={
        <>
          <TextFilter
            label="Date: yyyy/mm/dd"
            inputs={[
              {
                value: filters.dateMin,
                placeholder: "Start",
                onChange: (val) => {
                  setFilter("dateMin", val);
                  if (isValidDate(val)) handleSearch({ dateMin: val });
                },
              },
              {
                value: filters.dateMax,
                placeholder: "End",
                onChange: (val) => {
                  setFilter("dateMax", val);
                  if (isValidDate(val)) handleSearch({ dateMax: val });
                },
              },
            ]}
          />
          <TextFilter
            label="Total"
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
          <DropdownFilter
            label="Status"
            options={statusOptions}
            isGroupOptions={false}
            value={filters.status}
            onChange={(val) => setFilter("status", val)}
            mode="multi"
          />
          <TextFilter
            label="Delivery"
            inputs={[
              {
                value: filters.carrier,
                placeholder: "Carrier",
                onChange: (val) => update("carrier", val),
              },
              {
                value: filters.trackingNumber,
                placeholder: "Tracking",
                onChange: (val) => update("trackingNumber", val),
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
        </>
      }
    />
  );
}
