"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useFilterLogic, type FilterState } from "~/app/_hooks/useFilterLogic";
import { defaultOrderSort } from "~/const";

const SCHEMA = {
  id: "string",
  dateMin: "string",
  dateMax: "string",
  itemsMin: "string",
  itemsMax: "string",
  priceMin: "string",
  priceMax: "string",
  status: "stringArray",
  carrier: "string",
  trackingNumber: "string",
} as const;

type OrderFilters = FilterState<typeof SCHEMA>;

type OrderFilterContextType = {
  filters: OrderFilters;
  setFilter: <K extends keyof OrderFilters>(
    key: K,
    value: OrderFilters[K],
  ) => void;
  sort: string;
  setSort: (val: string) => void;
  handleSearch: (overrides?: Partial<OrderFilters & { sort: string }>) => void;
};

const OrderFilterContext = createContext<OrderFilterContextType | undefined>(
  undefined,
);

export function useOrderFilterContext() {
  const context = useContext(OrderFilterContext);
  if (!context) throw new Error("useOrderFilterContext within Provider");
  return context;
}

export function OrderFilterProvider({ children }: { children: ReactNode }) {
  const {
    filters,
    setFilter,
    sort,
    setSort,
    handleSearch: baseHandleSearch,
  } = useFilterLogic({
    schema: SCHEMA,
    defaultSort: defaultOrderSort,
    sortSessionKey: "order-sort",
  });

  const handleSearch = (
    overrides?: Partial<OrderFilters & { sort: string }>,
  ) => {
    baseHandleSearch("/orders", overrides);
  };

  return (
    <OrderFilterContext.Provider
      value={{ filters, setFilter, sort, setSort, handleSearch }}
    >
      {children}
    </OrderFilterContext.Provider>
  );
}
