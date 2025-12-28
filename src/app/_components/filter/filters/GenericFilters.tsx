"use client";

import type { ReactNode } from "react";
import { FiltersGrid } from "../FiltersGrid";
import type { FilterGroupOption, FilterOption } from "~/type"; // Import Group Option type
import TextFilter from "../TextFilter";
import DropdownFilter from "../DropdownFilter";

// --- Types ---

export type TextFilterConfig<T> = {
  type: "text";
  // reactKey: string;
  label: string;
  inputs: {
    filterStateName: keyof T;
    placeholder?: string;
    type: "text" | "number";
    min?: string | number;
    max?: string | number;
    validate?: (val: string) => boolean;
  }[];
};

// FIX 1: Make this a Discriminated Union.
// This allows TS to know: if isGroupOptions is true, options MUST be FilterGroupOption[]
export type DropdownFilterConfig<T> = {
  type: "dropdown";
  filterStateName: keyof T;
  label: string;
  mode: "single" | "multi";
} & (
  | { isGroupOptions: false; options: FilterOption[] }
  | { isGroupOptions: true; options: FilterGroupOption[] }
);

export type FilterConfig<T> = TextFilterConfig<T> | DropdownFilterConfig<T>;

interface GenericFiltersProps<T> {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: {
    filters: T;
    setFilter: (key: any, val: any) => void;
    handleSearch: (overrides: any) => void;
    sort: string;
    setSort: (val: string) => void;
  };
  filterConfigs: FilterConfig<T>[];
  sortOptions: FilterGroupOption[]; // Update to match proper Group Type
  gridClassName?: string;
  mainFilterKey?: string; // none means no main filter for mobile
  alwaysExpanded?: boolean;
}

export function GenericFilters<T extends Record<string, any>>({
  id,
  context,
  filterConfigs,
  sortOptions,
  gridClassName,
  mainFilterKey,
  alwaysExpanded = false,
}: GenericFiltersProps<T>) {
  const { filters, setFilter, sort, setSort, handleSearch } = context;

  const handleTextUpdate = (
    filterStateName: keyof T,
    newFilterStateValue: any,
    validate?: (v: string) => boolean,
  ) => {
    setFilter(filterStateName, newFilterStateValue);
    if (validate && !validate(newFilterStateValue)) return;
    handleSearch({ [filterStateName]: newFilterStateValue });
  };

  const renderFilter = (
    filterConfig: FilterConfig<T>,
    toggleAction?: ReactNode,
  ) => {
    if (filterConfig.type === "text") {
      return (
        <TextFilter
          key={filterConfig.label} // <--- CHANGED: Use label as key
          label={filterConfig.label}
          action={toggleAction}
          inputs={filterConfig.inputs.map((input) => ({
            value: filters[input.filterStateName],
            placeholder: input.placeholder,
            type: input.type,
            min: input.min,
            onChange: (val) =>
              handleTextUpdate(input.filterStateName, val, input.validate),
          }))}
        />
      );
    }

    if (filterConfig.type === "dropdown") {
      // FIX 2: Explicitly branch logic.
      // TypeScript can now infer correct types inside each block.
      if (filterConfig.isGroupOptions) {
        return (
          <DropdownFilter
            key={String(filterConfig.filterStateName)}
            label={filterConfig.label}
            isGroupOptions={true}
            options={filterConfig.options} // TS knows this is FilterGroupOption[]
            value={filters[filterConfig.filterStateName]}
            onChange={(val: any) =>
              setFilter(filterConfig.filterStateName, val)
            }
            mode={filterConfig.mode as any}
          />
        );
      } else {
        return (
          <DropdownFilter
            key={String(filterConfig.filterStateName)}
            label={filterConfig.label}
            isGroupOptions={false}
            options={filterConfig.options} // TS knows this is FilterOption[]
            value={filters[filterConfig.filterStateName]}
            onChange={(val: any) =>
              setFilter(filterConfig.filterStateName, val)
            }
            mode={filterConfig.mode as any}
          />
        );
      }
    }
    return null;
  };

  const mainFilterConfig = filterConfigs.find(
    (f) =>
      (f.type === "text" ? f.label : String(f.filterStateName)) ===
      mainFilterKey,
  );

  const otherFilterConfigs = filterConfigs.filter(
    (f) => f !== mainFilterConfig,
  );

  return (
    <FiltersGrid
      id={id}
      onSubmit={() => handleSearch({})}
      gridClassName={gridClassName}
      alwaysExpanded={alwaysExpanded}
      mainFilter={({ toggleAction }) =>
        mainFilterConfig ? renderFilter(mainFilterConfig, toggleAction) : null
      }
      expandableFilters={
        <>
          {otherFilterConfigs.map((config) => renderFilter(config))}

          <DropdownFilter
            label="Sort By"
            options={sortOptions}
            isGroupOptions={true}
            value={sort}
            onChange={setSort}
            mode="single"
          />
        </>
      }
    />
  );
}
