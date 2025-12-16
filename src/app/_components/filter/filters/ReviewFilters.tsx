"use client";

import DropdownFilter from "../DropdownFilter";
import { useReviewFilterContext } from "~/app/_contexts/filter/ReviewFilterProvider";
import { reviewSortOptions } from "~/const";
import type { FilterOption } from "~/type";
import { FilterLayout } from "../FilterLayout";

const ratingOptions: FilterOption[] = [
  { label: "1 star", urlInput: "1" },
  { label: "2 star", urlInput: "2" },
  { label: "3 star", urlInput: "3" },
  { label: "4 star", urlInput: "4" },
  { label: "5 star", urlInput: "5" },
];

export default function ReviewFilters() {
  const { filters, setFilter, sort, setSort, handleSearch } =
    useReviewFilterContext();

  return (
    <FilterLayout
      id="review-filters"
      onSubmit={() => handleSearch()}
      alwaysExpanded={true}
      mainFilter={() => (
        // Review filters didn't have a "Main" input in your original code,
        // so we treat the first dropdown as main, or just split them equally.
        // Here we just render the first one.
        <DropdownFilter
          label="Rating"
          options={ratingOptions}
          isGroupOptions={false}
          value={filters.rating}
          onChange={(val) => setFilter("rating", val)}
          mode="multi"
        />
      )}
      expandableFilters={
        <DropdownFilter
          label="Sort"
          options={reviewSortOptions}
          isGroupOptions={true}
          value={sort}
          onChange={setSort}
          mode="single"
        />
      }
    />
  );
}
