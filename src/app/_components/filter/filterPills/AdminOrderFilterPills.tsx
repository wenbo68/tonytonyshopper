"use client";

import { useOrderFilterContext } from "~/app/_contexts/filter/OrderFilterProvider";
import { orderSortOptions } from "~/const";
import { GenericFilterPills, type PillDefinition } from "../GenericFilterPills";
import { useAdminOrderFilterContext } from "~/app/_contexts/filter/AdminOrderFilterProvider";
// import { GenericFilterPills, type PillDefinition } from "./GenericFilterPills";

export default function OrderFilterPills() {
  const context = useAdminOrderFilterContext();

  const definitions: Partial<
    Record<keyof typeof context.filters, PillDefinition<any>>
  > = {
    id: { label: (val) => `ID: ${val}`, color: 1 },
    dateMin: { label: (val) => `Start: ${val}`, color: 2 },
    dateMax: { label: (val) => `End: ${val}`, color: 2 },
    customerName: { label: (val) => `Name: ${val}`, color: 3 },
    customerEmail: { label: (val) => `Email: ${val}`, color: 3 },
    priceMin: { label: (val) => `Total Min: $${val}`, color: 4 },
    priceMax: { label: (val) => `Total Max: $${val}`, color: 4 },
    status: {
      label: (val) => `Status: ${val.charAt(0).toUpperCase() + val.slice(1)}`,
      color: 5,
    },
    carrier: { label: (val) => `Carrier: ${val}`, color: 6 },
    trackingNumber: { label: (val) => `Tracking: ${val}`, color: 6 },
  };

  return (
    <GenericFilterPills
      context={context}
      definitions={definitions}
      sortOptions={orderSortOptions}
    />
  );
}
