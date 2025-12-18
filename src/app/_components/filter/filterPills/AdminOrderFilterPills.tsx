"use client";

import { orderSortOptions } from "~/const";
import { GenericFilterPills, type BasePillConfig } from "./GenericFilterPills";
import { useAdminOrderFilterContext } from "~/app/_contexts/filter/AdminOrderFilterProvider";

export default function OrderFilterPills() {
  const context = useAdminOrderFilterContext();

  const definitions: Partial<
    Record<keyof typeof context.filters, BasePillConfig<any>>
  > = {
    id: { getLabelFromFilterState: (val) => `ID: ${val}`, color: 1 },
    dateMin: { getLabelFromFilterState: (val) => `Start: ${val}`, color: 2 },
    dateMax: { getLabelFromFilterState: (val) => `End: ${val}`, color: 2 },
    customerName: {
      getLabelFromFilterState: (val) => `Name: ${val}`,
      color: 3,
    },
    customerEmail: {
      getLabelFromFilterState: (val) => `Email: ${val}`,
      color: 3,
    },
    itemsMin: {
      getLabelFromFilterState: (val) => `Items Min: ${val}`,
      color: 4,
    },
    itemsMax: {
      getLabelFromFilterState: (val) => `Items Max: ${val}`,
      color: 4,
    },
    itemName: {
      getLabelFromFilterState: (val) => `Item Name: ${val}`,
      color: 5,
    },
    priceMin: {
      getLabelFromFilterState: (val) => `Total Min: $${val}`,
      color: 6,
    },
    priceMax: {
      getLabelFromFilterState: (val) => `Total Max: $${val}`,
      color: 6,
    },
    status: {
      getLabelFromFilterState: (val) =>
        `Status: ${val.charAt(0).toUpperCase() + val.slice(1)}`,
      color: 7,
    },
    carrier: { getLabelFromFilterState: (val) => `Carrier: ${val}`, color: 8 },
    trackingNumber: {
      getLabelFromFilterState: (val) => `Tracking: ${val}`,
      color: 8,
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
