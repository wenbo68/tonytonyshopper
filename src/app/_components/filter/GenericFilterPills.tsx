// src/app/_components/filter/GenericFilterPills.tsx
"use client";

import { useMemo } from "react";
import type { FilterGroupOption, PillConfig } from "~/type";
import { ClickablePill, PillContainer, UnclickablePill } from "./FilterPill";

// Define how each filter field should be displayed
export type PillDefinition<T> = {
  /** Function to format the value into a readable label */
  label: (value: string) => string;
  /** Color index for the pill style */
  color: number;
};

// The props accept the generic Context structure we created in the previous refactor
interface GenericFilterPillsProps<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: {
    filters: T;
    setFilter: (key: any, val: any) => void;
    handleSearch: (overrides: any) => void;
    sort: string;
  };
  definitions: Partial<Record<keyof T, PillDefinition<T>>>;
  sortOptions: {
    groupLabel: string;
    options: { label: string; urlInput: string }[];
  }[];
}

export function GenericFilterPills<
  T extends Record<string, string | string[]>,
>({ context, definitions, sortOptions }: GenericFilterPillsProps<T>) {
  const { filters, setFilter, handleSearch, sort } = context;

  const { pillConfigs, sortLabel } = useMemo(() => {
    const configs: PillConfig[] = [];

    // 1. Iterate through the definitions provided by the parent
    (Object.keys(definitions) as Array<keyof T>).forEach((key) => {
      const def = definitions[key];
      const value = filters[key];

      if (!def || !value || value.length === 0) return;

      // Helper to generate the pill object
      const createPill = (val: string, onRemove: () => void) => ({
        key: `${String(key)}-${val}`,
        label: def.label(val),
        color: def.color as PillConfig["color"],
        onRemove,
      });

      // 2. Handle Arrays (e.g., status, category)
      if (Array.isArray(value)) {
        value.forEach((item) => {
          configs.push(
            createPill(item, () => {
              const newValue = value.filter((v) => v !== item);
              setFilter(key, newValue);
              handleSearch({ [key]: newValue });
            }),
          );
        });
      }
      // 3. Handle Strings (e.g., name, priceMin)
      else if (typeof value === "string") {
        configs.push(
          createPill(value, () => {
            setFilter(key, "");
            handleSearch({ [key]: "" });
          }),
        );
      }
    });

    // 4. Calculate Sort Label
    let currentSortLabel: string | null = null;
    if (sort) {
      for (const group of sortOptions) {
        const foundOption = group.options.find((opt) => opt.urlInput === sort);
        if (foundOption) {
          currentSortLabel = `${group.groupLabel}: ${foundOption.label}`;
          break;
        }
      }
    }

    return { pillConfigs: configs, sortLabel: currentSortLabel };
  }, [filters, definitions, sort, sortOptions, setFilter, handleSearch]);

  return (
    <PillContainer>
      <>
        {pillConfigs.map((config) => (
          <ClickablePill
            key={config.key}
            label={config.label}
            color={config.color}
            onRemove={config.onRemove!} // It will always have onRemove in this logic
          />
        ))}
        <UnclickablePill label={sortLabel ?? "Empty Search"} color="gray" />
      </>
    </PillContainer>
  );
}
