"use client";

import { useMemo } from "react";
import type { PillConfig } from "~/type";
import {
  ClickablePill,
  PillContainer,
  UnclickablePill,
} from "~/app/_components/Pill";

// Define how each filter field should be displayed
export type BasePillConfig<T> = {
  /** Function to format the filterState into a readable label */
  getLabelFromFilterState: (filterState: string) => string;
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
  basePillConfigs: Partial<Record<keyof T, BasePillConfig<T>>>;
  sortOptions: {
    groupLabel: string;
    options: { label: string; urlInput: string }[];
  }[];
}

export function GenericFilterPills<
  T extends Record<string, string | string[]>,
>({ context, basePillConfigs, sortOptions }: GenericFilterPillsProps<T>) {
  const { filters, setFilter, handleSearch, sort } = context;

  const { pillConfigs, sortLabel } = useMemo(() => {
    const configs: PillConfig[] = [];

    // 1. Iterate through the definitions provided by the parent
    (Object.keys(basePillConfigs) as Array<keyof T>).forEach((key) => {
      const basePillConfig = basePillConfigs[key];
      const filterState = filters[key];

      if (!basePillConfig || !filterState || filterState.length === 0) return;

      // Helper to generate the pill object
      const createPillConfig = (state: string, onRemove: () => void) => ({
        key: `${String(key)}-${state}`,
        label: basePillConfig.getLabelFromFilterState(state),
        color: basePillConfig.color as PillConfig["color"],
        onRemove,
      });

      // 2. Handle Arrays (e.g., status, category)
      if (Array.isArray(filterState)) {
        filterState.forEach((state) => {
          configs.push(
            createPillConfig(state, () => {
              const newValue = filterState.filter((v) => v !== state);
              setFilter(key, newValue);
              handleSearch({ [key]: newValue });
            }),
          );
        });
      }
      // 3. Handle Strings (e.g., name, priceMin)
      else if (typeof filterState === "string") {
        configs.push(
          createPillConfig(filterState, () => {
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
  }, [filters, basePillConfigs, sort, sortOptions, setFilter, handleSearch]);

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
