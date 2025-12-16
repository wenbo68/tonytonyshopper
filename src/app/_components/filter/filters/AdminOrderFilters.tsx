"use client";

import { useAdminOrderFilterContext } from "~/app/_contexts/filter/AdminOrderFilterProvider";
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

export default function AdminOrderFilters() {
  const context = useAdminOrderFilterContext();

  const fields: FilterConfig<typeof context.filters>[] = [
    {
      type: "text",
      key: "id",
      label: "Order ID",
      inputs: [{ key: "id", placeholder: "Enter ID...", type: "text" }],
    },
    {
      type: "text",
      key: "date",
      label: "Date: yyyy/mm/dd",
      inputs: [
        {
          key: "dateMin",
          placeholder: "Start",
          type: "text",
          validate: isValidDate,
        },
        {
          key: "dateMax",
          placeholder: "End",
          type: "text",
          validate: isValidDate,
        },
      ],
    },
    {
      type: "text",
      key: "customer",
      label: "Customer",
      inputs: [
        { key: "customerName", placeholder: "Name", type: "text" },
        { key: "customerEmail", placeholder: "Email", type: "text" },
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
        { key: "carrier", placeholder: "Carrier", type: "text" },
        { key: "trackingNumber", placeholder: "Tracking", type: "text" },
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
