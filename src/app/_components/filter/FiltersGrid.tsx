// src/app/_components/filter/FilterLayout.tsx
"use client";

import { type ReactNode, useState } from "react";
import { IoIosArrowDown } from "react-icons/io";

interface FiltersGridProps {
  id: string;
  onSubmit: () => void;
  /** The primary filter input visible on mobile (usually ID or Name) */
  mainFilter: (props: { toggleAction: ReactNode }) => ReactNode;
  /** The remaining filters hidden on mobile by default */
  expandableFilters: ReactNode;
  gridClassName?: string;
  /** Optional: If true, renders without the mobile toggle logic (like ReviewFilters) */
  alwaysExpanded?: boolean;
}

export function FiltersGrid({
  id,
  onSubmit,
  mainFilter,
  expandableFilters,
  gridClassName,
  alwaysExpanded = false,
}: FiltersGridProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Common Grid Classes
  const defaultGridClassName =
    "grid w-full grid-cols-2 gap-2 text-sm sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 lg:gap-5 xl:grid-cols-5 xl:gap-6";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const ToggleButton = (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className="cursor-pointer rounded bg-gray-900 p-2 sm:hidden"
      aria-label="Toggle filters"
    >
      <IoIosArrowDown
        className={`h-5 w-5 transform transition-transform duration-200 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className={gridClassName ?? defaultGridClassName}
    >
      {/* 1. Main Filter (Always Visible) */}
      <div className={alwaysExpanded ? "contents" : "col-span-2 sm:col-span-1"}>
        {/* We pass the button to the child, so it can inject it into the input's action slot */}
        {mainFilter({ toggleAction: alwaysExpanded ? null : ToggleButton })}
      </div>

      {/* 2. Expandable Filters */}
      <div
        className={`${
          isOpen || alwaysExpanded ? "contents" : "hidden"
        } sm:contents`}
      >
        {expandableFilters}
      </div>
    </form>
  );
}
