"use client";

import { useParams } from "next/navigation";
import { createContext, useContext, type ReactNode } from "react";
import { useFilterLogic, type FilterState } from "~/app/_hooks/useFilterLogic";
import { defaultReviewSort } from "~/const";

// 1. Define Schema
const SCHEMA = {
  rating: "array",
} as const;

// 2. Define Types based on Schema
type ReviewFilters = FilterState<typeof SCHEMA>;

type ReviewFilterContextType = {
  filters: ReviewFilters;
  setFilter: <K extends keyof ReviewFilters>(
    key: K,
    value: ReviewFilters[K],
  ) => void;
  sort: string;
  setSort: (val: string) => void;
  handleSearch: (overrides?: Partial<ReviewFilters & { sort: string }>) => void;
};

const FilterContext = createContext<ReviewFilterContextType | undefined>(
  undefined,
);

export function useReviewFilterContext() {
  const context = useContext(FilterContext);
  if (!context)
    throw new Error("useReviewFilterContext must be used within Provider");
  return context;
}

export function ReviewFilterProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const productId = params.productId as string;

  const {
    filters,
    setFilter,
    sort,
    setSort,
    handleSearch: baseHandleSearch,
  } = useFilterLogic({
    schema: SCHEMA,
    defaultSort: defaultReviewSort,
    sortSessionKey: "review-sort",
  });

  const handleSearch = (
    overrides?: Partial<ReviewFilters & { sort: string }>,
  ) => {
    baseHandleSearch(`/product/${productId}`, overrides, "#review-filters");
  };

  return (
    <FilterContext.Provider
      value={{ filters, setFilter, sort, setSort, handleSearch }}
    >
      {children}
    </FilterContext.Provider>
  );
}
