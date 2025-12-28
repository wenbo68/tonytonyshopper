"use client";

import { useOrderFilterContext } from "~/app/_contexts/filter/OrderFilterProvider";
import { orderSortOptions } from "~/const";
import { isValidDate } from "~/server/utils/generic";
import type { FilterOption } from "~/type";
import { GenericFilters, type FilterConfig } from "./GenericFilters";

// const statusOptions: FilterOption[] = [
//   { label: "Paid", urlInput: "paid" },
//   { label: "Shipped", urlInput: "shipped" },
//   { label: "Cancelled", urlInput: "cancelled" },
//   { label: "Pending", urlInput: "pending" },
// ];

export default function OrderFilters() {
  const context = useOrderFilterContext();

  const fields: FilterConfig<typeof context.filters>[] = [
    {
      type: "text",
      label: "Order ID",
      inputs: [
        { filterStateName: "id", type: "text", placeholder: "Enter ID..." },
      ],
    },
    {
      type: "text",
      label: "Date: yyyy/mm/dd",
      inputs: [
        {
          filterStateName: "dateMin",
          type: "text",
          placeholder: "Start",
          validate: isValidDate,
        },
        {
          filterStateName: "dateMax",
          type: "text",
          placeholder: "End",
          validate: isValidDate,
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
    // {
    //   type: "dropdown",
    //   filterStateName: "status",
    //   label: "Status",
    //   options: statusOptions,
    //   isGroupOptions: false,
    //   mode: "multi",
    // },
    {
      type: "text",
      label: "Delivery",
      inputs: [
        { filterStateName: "carrier", type: "text", placeholder: "Carrier" },
        {
          filterStateName: "trackingNumber",
          type: "text",
          placeholder: "Tracking",
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
      sortOptions={orderSortOptions}
    />
  );
}
