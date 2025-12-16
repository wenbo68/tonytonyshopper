"use client";

import { useOrderFilterContext } from "~/app/_contexts/filter/OrderFilterProvider";
import { orderSortOptions } from "~/const";
import { isValidDate } from "~/server/utils/generic";
import type { FilterOption } from "~/type";
import { GenericFilters, type FilterConfig } from "./GenericFilters";

const statusOptions: FilterOption[] = [
  { label: "Paid", urlInput: "paid" },
  { label: "Shipped", urlInput: "shipped" },
  { label: "Cancelled", urlInput: "cancelled" },
  { label: "Pending", urlInput: "pending" },
];

export default function OrderFilters() {
  const context = useOrderFilterContext();

  const fields: FilterConfig<typeof context.filters>[] = [
    {
      type: "text",
      key: "id",
      label: "Order ID",
      inputs: [{ key: "id", type: "text", placeholder: "Enter ID..." }],
    },
    {
      type: "text",
      key: "date",
      label: "Date: yyyy/mm/dd",
      inputs: [
        {
          key: "dateMin",
          type: "text",
          placeholder: "Start",
          validate: isValidDate,
        },
        {
          key: "dateMax",
          type: "text",
          placeholder: "End",
          validate: isValidDate,
        },
      ],
    },
    {
      type: "text",
      key: "total",
      label: "Total",
      inputs: [
        { key: "priceMin", placeholder: "Min", type: "number", min: 0 },
        { key: "priceMax", placeholder: "Max", type: "number", min: 0 },
      ],
    },
    {
      type: "dropdown",
      key: "status",
      label: "Status",
      options: statusOptions,
      isGroupOptions: false,
      mode: "multi",
    },
    {
      type: "text",
      key: "delivery",
      label: "Delivery",
      inputs: [
        { key: "carrier", type: "text", placeholder: "Carrier" },
        { key: "trackingNumber", type: "text", placeholder: "Tracking" },
      ],
    },
  ];

  return (
    <GenericFilters
      id="order-filters"
      context={context}
      filterConfigs={fields}
      mainFilterKey="id"
      sortOptions={orderSortOptions}
    />
  );
}
