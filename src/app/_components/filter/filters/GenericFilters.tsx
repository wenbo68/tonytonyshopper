"use client";

import type { ReactNode } from "react";
import { FiltersGrid } from "../FiltersGrid";
import type { FilterGroupOption, FilterOption } from "~/type"; // Import Group Option type
import TextFilter from "../TextFilter";
import DropdownFilter from "../DropdownFilter";

// --- Types ---

export type TextFilterConfig<T> = {
  type: "text";
  key: string;
  label: string;
  inputs: {
    key: keyof T;
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
  key: keyof T;
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
  mainFilterKey?: string; // none means no main filter for mobile
  alwaysExpanded?: boolean;
}

export function GenericFilters<T extends Record<string, any>>({
  id,
  context,
  filterConfigs,
  sortOptions,
  mainFilterKey,
  alwaysExpanded = false,
}: GenericFiltersProps<T>) {
  const { filters, setFilter, sort, setSort, handleSearch } = context;

  const handleTextUpdate = (
    key: keyof T,
    val: any,
    validate?: (v: string) => boolean,
  ) => {
    setFilter(key, val);
    if (validate && !validate(val)) return;
    handleSearch({ [key]: val });
  };

  const renderFilter = (config: FilterConfig<T>, toggleAction?: ReactNode) => {
    if (config.type === "text") {
      return (
        <TextFilter
          key={config.key}
          label={config.label}
          action={toggleAction}
          inputs={config.inputs.map((input) => ({
            value: filters[input.key],
            placeholder: input.placeholder,
            type: input.type,
            min: input.min,
            onChange: (val) => handleTextUpdate(input.key, val, input.validate),
          }))}
        />
      );
    }

    if (config.type === "dropdown") {
      // FIX 2: Explicitly branch logic.
      // TypeScript can now infer correct types inside each block.
      if (config.isGroupOptions) {
        return (
          <DropdownFilter
            key={String(config.key)}
            label={config.label}
            isGroupOptions={true}
            options={config.options} // TS knows this is FilterGroupOption[]
            value={filters[config.key]}
            onChange={(val: any) => setFilter(config.key, val)}
            mode={config.mode as any}
          />
        );
      } else {
        return (
          <DropdownFilter
            key={String(config.key)}
            label={config.label}
            isGroupOptions={false}
            options={config.options} // TS knows this is FilterOption[]
            value={filters[config.key]}
            onChange={(val: any) => setFilter(config.key, val)}
            mode={config.mode as any}
          />
        );
      }
    }
    return null;
  };

  const mainFilterConfig = filterConfigs.find(
    (f) => (f.type === "text" ? f.key : String(f.key)) === mainFilterKey,
  );

  const otherFilterConfigs = filterConfigs.filter(
    (f) => f !== mainFilterConfig,
  );

  return (
    <FiltersGrid
      id={id}
      onSubmit={() => handleSearch({})}
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
