"use client";

import { createContext, useContext, type ReactNode } from "react";
import { defaultProductSort } from "~/const";
import { useFilterLogic, type FilterState } from "~/app/_hooks/useFilterLogic";

const SCHEMA = {
  name: "string",
  category: "stringArray",
  priceMin: "string",
  priceMax: "string",
  ratingMin: "string",
  ratingMax: "string",
  createdMin: "string",
  createdMax: "string",
  stock: "stringArray",
} as const;

type ProductFilters = FilterState<typeof SCHEMA>;

type ProductFilterContextType = {
  filters: ProductFilters;
  setFilter: <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ) => void;
  sort: string;
  setSort: (val: string) => void;
  handleSearch: (
    overrides?: Partial<ProductFilters & { sort: string }>,
  ) => void;
};

const ProductFilterContext = createContext<
  ProductFilterContextType | undefined
>(undefined);

export function useProductFilterContext() {
  const context = useContext(ProductFilterContext);
  if (!context) throw new Error("useProductFilterContext within Provider");
  return context;
}

export function ProductFilterProvider({ children }: { children: ReactNode }) {
  const {
    filters,
    setFilter,
    sort,
    setSort,
    handleSearch: baseHandleSearch,
  } = useFilterLogic({
    schema: SCHEMA,
    defaultSort: defaultProductSort,
    sortSessionKey: "product-sort",
  });

  const handleSearch = (
    overrides?: Partial<ProductFilters & { sort: string }>,
  ) => {
    baseHandleSearch("/product/all", overrides);
  };

  return (
    <ProductFilterContext.Provider
      value={{ filters, setFilter, sort, setSort, handleSearch }}
    >
      {children}
    </ProductFilterContext.Provider>
  );
}
