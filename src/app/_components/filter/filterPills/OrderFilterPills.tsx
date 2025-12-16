"use client";

import { useOrderFilterContext } from "~/app/_contexts/filter/OrderFilterProvider";
import { orderSortOptions } from "~/const";
import { GenericFilterPills, type PillDefinition } from "../GenericFilterPills";
// import { GenericFilterPills, type PillDefinition } from "./GenericFilterPills";

export default function OrderFilterPills() {
  const context = useOrderFilterContext();

  const definitions: Partial<
    Record<keyof typeof context.filters, PillDefinition<any>>
  > = {
    id: { label: (val) => `ID: ${val}`, color: 1 },
    dateMin: { label: (val) => `Start: ${val}`, color: 2 },
    dateMax: { label: (val) => `End: ${val}`, color: 2 },
    priceMin: { label: (val) => `Total Min: $${val}`, color: 3 },
    priceMax: { label: (val) => `Total Max: $${val}`, color: 3 },
    status: {
      label: (val) => `Status: ${val.charAt(0).toUpperCase() + val.slice(1)}`,
      color: 4,
    },
    carrier: { label: (val) => `Carrier: ${val}`, color: 5 },
    trackingNumber: { label: (val) => `Tracking: ${val}`, color: 5 },
  };

  return (
    <GenericFilterPills
      context={context}
      definitions={definitions}
      sortOptions={orderSortOptions}
    />
  );
}
