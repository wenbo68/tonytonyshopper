"use client";

import { useOrderFilterContext } from "~/app/_contexts/filter/OrderFilterProvider";
import { orderSortOptions } from "~/const";
import { GenericFilterPills, type BasePillConfig } from "./GenericFilterPills";

export default function OrderFilterPills() {
  const context = useOrderFilterContext();

  const definitions: Partial<
    Record<keyof typeof context.filters, BasePillConfig<any>>
  > = {
    id: { getLabelFromFilterState: (val) => `ID: ${val}`, color: 1 },
    dateMin: { getLabelFromFilterState: (val) => `Start: ${val}`, color: 2 },
    dateMax: { getLabelFromFilterState: (val) => `End: ${val}`, color: 2 },
    priceMin: {
      getLabelFromFilterState: (val) => `Total Min: $${val}`,
      color: 3,
    },
    priceMax: {
      getLabelFromFilterState: (val) => `Total Max: $${val}`,
      color: 3,
    },
    status: {
      getLabelFromFilterState: (val) =>
        `Status: ${val.charAt(0).toUpperCase() + val.slice(1)}`,
      color: 4,
    },
    carrier: { getLabelFromFilterState: (val) => `Carrier: ${val}`, color: 5 },
    trackingNumber: {
      getLabelFromFilterState: (val) => `Tracking: ${val}`,
      color: 5,
    },
  };

  return (
    <GenericFilterPills
      context={context}
      basePillConfigs={definitions}
      sortOptions={orderSortOptions}
    />
  );
}
