"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSessionStorageState } from "./useSessionStorage";

type FilterType = "string" | "stringArray";

export type FilterSchema = Record<string, FilterType>;

// Helper to infer the shape of the state based on the schema
export type FilterState<T extends FilterSchema> = {
  [K in keyof T]: T[K] extends "stringArray" ? string[] : string;
};

interface UseFilterLogicProps<T extends FilterSchema> {
  schema: T;
  defaultSort: string;
  sortSessionKey: string;
}

export function useFilterLogic<T extends FilterSchema>({
  schema,
  defaultSort,
  sortSessionKey,
}: UseFilterLogicProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Initial State Helper
  const getInitialState = () => {
    const initialState = {} as FilterState<T>;
    for (const key in schema) {
      if (schema[key] === "stringArray") {
        // @ts-expect-error - dynamic assignment is safe here
        initialState[key] = searchParams.getAll(key);
      } else {
        // @ts-expect-error - dynamic assignment is safe here
        initialState[key] = searchParams.get(key) ?? "";
      }
    }
    return initialState;
  };

  // 2. State
  // We bundle all filters into one object to avoid dynamic useState calls
  const [filters, setFilters] = useState<FilterState<T>>(getInitialState);

  const [sort, setSort] = useSessionStorageState(
    sortSessionKey,
    searchParams.get("sort") ?? defaultSort,
  );

  // 3. Sync URL to State (when back/forward buttons are used)
  useEffect(() => {
    setFilters(getInitialState());
    setSort(searchParams.get("sort") ?? defaultSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 4. Handle Search (Push to URL)
  const handleSearch = useCallback(
    (
      basePath: string,
      overrides: Partial<FilterState<T> & { sort: string }> = {},
      hash?: string,
    ) => {
      const newParams = new URLSearchParams();

      // Merge current state with overrides
      const currentFilters = { ...filters, ...overrides };
      const currentSort = overrides.sort ?? sort;

      // Append filters
      for (const key in schema) {
        const value = currentFilters[key];
        if (Array.isArray(value)) {
          value.forEach((v) => newParams.append(key, v));
        } else if (value) {
          newParams.set(key, value);
        }
      }

      // Append Sort
      if (currentSort) {
        newParams.set("sort", currentSort);
        // If sorting changed via override, update session storage
        if (overrides.sort) setSort(currentSort);
      } else {
        newParams.set("sort", defaultSort);
        setSort(defaultSort);
      }

      // Always reset page
      newParams.set("page", "1");

      // Build URL and optionally append hash
      let url = `${basePath}?${newParams.toString()}`;
      if (hash) {
        url = `${url}${hash}`;
      }

      router.push(url);
    },
    [filters, sort, router, schema, defaultSort, setSort],
  );

  // Helper to update a specific filter field individually (for UI inputs)
  const setFilter = <K extends keyof T>(key: K, value: FilterState<T>[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return {
    filters,
    setFilter, // use this like: setFilter('priceMin', '100')
    setFilters, // use this to bulk update
    sort,
    setSort,
    handleSearch,
  };
}
