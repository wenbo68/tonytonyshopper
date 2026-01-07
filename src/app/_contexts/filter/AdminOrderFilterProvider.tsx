"use client";

import { createContext, Suspense, useContext, type ReactNode } from "react";
import { useFilterLogic, type FilterState } from "~/app/_hooks/useFilterLogic";
import { defaultOrderSort } from "~/const";

const SCHEMA = {
  id: "string",
  customerName: "string",
  customerEmail: "string",
  dateMin: "string",
  dateMax: "string",
  itemsMin: "string",
  itemsMax: "string",
  itemName: "string",
  priceMin: "string",
  priceMax: "string",
  status: "stringArray",
  carrier: "string",
  trackingNumber: "string",
} as const;

type AdminOrderFilters = FilterState<typeof SCHEMA>;

type AdminOrderFilterContextType = {
  filters: AdminOrderFilters;
  setFilter: <K extends keyof AdminOrderFilters>(
    key: K,
    value: AdminOrderFilters[K],
  ) => void;
  sort: string;
  setSort: (val: string) => void;
  handleSearch: (
    overrides?: Partial<AdminOrderFilters & { sort: string }>,
  ) => void;
};

const AdminOrderFilterContext = createContext<
  AdminOrderFilterContextType | undefined
>(undefined);

export function useAdminOrderFilterContext() {
  const context = useContext(AdminOrderFilterContext);
  if (!context) throw new Error("useAdminOrderFilterContext within Provider");
  return context;
}

export function AdminOrderFilterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    filters,
    setFilter,
    sort,
    setSort,
    handleSearch: baseHandleSearch,
  } = useFilterLogic({
    schema: SCHEMA,
    defaultSort: defaultOrderSort,
    sortSessionKey: "admin-order-sort",
  });

  const handleSearch = (
    overrides?: Partial<AdminOrderFilters & { sort: string }>,
  ) => {
    baseHandleSearch("/orders/admin", overrides);
  };

  return (
    // <Suspense fallback={null}>
    <AdminOrderFilterContext.Provider
      value={{ filters, setFilter, sort, setSort, handleSearch }}
    >
      {children}
    </AdminOrderFilterContext.Provider>
    // </Suspense>
  );
}
