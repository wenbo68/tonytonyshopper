"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useSessionStorageState } from "../../_hooks/useSessionStorage";
import { defaultReviewSort } from "~/const";

type Overrides = Partial<{
  rating: string[];
  sort: string;
}>;

// Define the context type
type ReviewFilterContextType = {
  rating: string[];
  setRating: Dispatch<SetStateAction<string[]>>;
  sort: string;
  setSort: Dispatch<SetStateAction<string>>;
  handleSearch: (overrides?: Overrides) => void;
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
  const params = useParams(); // 2. Get the route parameters

  const productId = params.productId as string;

  // 1. use states for instant highlight on selected filter options
  const [rating, setRating] = useState(() => searchParams.getAll("rating"));
  const [sort, setSort] = useSessionStorageState(
    "review-sort",
    searchParams.get("sort") ?? defaultReviewSort,
  );

  // 2. sync url to states
  useEffect(() => {
    setRating(searchParams.getAll("rating"));
    setSort(searchParams.get("sort") ?? defaultReviewSort);
  }, [searchParams]);

  // 3. sync state (or arbitrary value) to url
  const handleSearch = (overrides: Overrides = {}) => {
    const newParams = new URLSearchParams();

    // Use overrides if provided, otherwise fall back to state
    const finalRating = overrides.rating ?? rating;
    const finalSort = overrides.sort ?? sort;

    finalRating.forEach((v) => newParams.append("rating", v));
    if (finalSort) {
      newParams.set("sort", finalSort);
    } else {
      setSort(defaultReviewSort);
      newParams.set("sort", defaultReviewSort);
    }

    // Always reset to page 1 for a new search
    newParams.set("page", "1");

    const url = `/product/${productId}?${newParams.toString()}#review-filters`;
    router.push(url);
  };

  const value = {
    rating,
    setRating,
    sort,
    setSort,
    handleSearch,
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}
