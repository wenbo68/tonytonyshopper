"use client";

import { useAdminOrderFilterContext } from "~/app/_contexts/filter/AdminOrderFilterProvider";
import { adminOrderSortOptions, orderSortOptions } from "~/const";
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
      label: "Order ID",
      inputs: [
        { filterStateName: "id", placeholder: "Enter ID...", type: "text" },
      ],
    },
    {
      type: "text",
      label: "Date: yyyy/mm/dd",
      inputs: [
        {
          filterStateName: "dateMin",
          placeholder: "Start",
          type: "text",
          validate: isValidDate,
        },
        {
          filterStateName: "dateMax",
          placeholder: "End",
          type: "text",
          validate: isValidDate,
        },
      ],
    },
    {
      type: "text",
      label: "Customer",
      inputs: [
        { filterStateName: "customerName", placeholder: "Name", type: "text" },
        {
          filterStateName: "customerEmail",
          placeholder: "Email",
          type: "text",
        },
      ],
    },
    {
      type: "text",
      label: "Num of Items",
      inputs: [
        {
          filterStateName: "itemsMin",
          placeholder: "Min",
          type: "number",
          min: 0,
        },
        {
          filterStateName: "itemsMax",
          placeholder: "Max",
          type: "number",
          min: 0,
        },
      ],
    },
    {
      type: "text",
      label: "Item Name",
      inputs: [
        {
          filterStateName: "itemName",
          placeholder: "Enter name...",
          type: "text",
        },
      ],
    },
    {
      type: "text",
      label: "Total",
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
      type: "dropdown",
      filterStateName: "status",
      label: "Status",
      options: statusOptions,
      isGroupOptions: false,
      mode: "multi",
    },
    {
      type: "text",
      label: "Delivery",
      inputs: [
        { filterStateName: "carrier", placeholder: "Carrier", type: "text" },
        {
          filterStateName: "trackingNumber",
          placeholder: "Tracking",
          type: "text",
        },
      ],
    },
  ];

  return (
    <GenericFilters
      id="order-filters"
      context={context}
      filterConfigs={fields}
      mainFilterKey="Order ID"
      sortOptions={adminOrderSortOptions}
    />
  );
}
