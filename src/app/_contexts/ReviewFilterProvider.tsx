"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useSessionStorageState } from "../_hooks/useSessionStorage";

// Define the context type
type ReviewFilterContextType = {
  rating: string[];
  setRating: Dispatch<SetStateAction<string[]>>;
  order: string;
  setOrder: Dispatch<SetStateAction<string>>;
  handleSearch: (
    overrides?: Partial<{
      packageType: string[];
      rating: string[];
      order: string;
    }>,
  ) => void;
};

const FilterContext = createContext<ReviewFilterContextType | undefined>(
  undefined,
);

export function useReviewFilterContext() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
}

export function ReviewFilterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. use states for instant highlight on selected filter options
  const [rating, setRating] = useState(() => searchParams.getAll("rating"));
  const [order, setOrder] = useSessionStorageState(
    "order",
    searchParams.get("order") ?? "",
  );

  // 2. sync url to states
  useEffect(() => {
    setRating(searchParams.getAll("rating"));
    setOrder(searchParams.get("order") ?? "");
  }, [searchParams]);

  // 3. sync state (or arbitrary value) to url
  type SearchParamsOverride = Partial<{
    rating: string[];
    order: string;
  }>;

  const handleSearch = (overrides: SearchParamsOverride = {}) => {
    const newParams = new URLSearchParams();

    // Use overrides if provided, otherwise fall back to state
    const finalRating = overrides.rating ?? rating;
    const finalOrder = overrides.order ?? order;

    finalRating.forEach((v) => newParams.append("rating", v));
    if (finalOrder) {
      newParams.set("order", finalOrder);
    } else {
      setOrder("created-desc");
      newParams.set("order", "created-desc");
    }

    // Always reset to page 1 for a new search
    newParams.set("page", "1");

    const url = `/services?${newParams.toString()}#review-filters`;
    router.push(url);
  };

  const value = {
    rating,
    setRating,
    order,
    setOrder,
    handleSearch,
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}
