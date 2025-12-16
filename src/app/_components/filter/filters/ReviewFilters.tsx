"use client";

import { useReviewFilterContext } from "~/app/_contexts/filter/ReviewFilterProvider";
import { reviewSortOptions } from "~/const";
import type { FilterOption } from "~/type";
import { GenericFilters, type FilterConfig } from "./GenericFilters";

const ratingOptions: FilterOption[] = [
  { label: "1 star", urlInput: "1" },
  { label: "2 star", urlInput: "2" },
  { label: "3 star", urlInput: "3" },
  { label: "4 star", urlInput: "4" },
  { label: "5 star", urlInput: "5" },
];

export default function ReviewFilters() {
  const context = useReviewFilterContext();

  const fields: FilterConfig<typeof context.filters>[] = [
    {
      type: "dropdown",
      key: "rating",
      label: "Rating",
      options: ratingOptions,
      isGroupOptions: false,
      mode: "multi",
    },
  ];

  return (
    <GenericFilters
      id="review-filters"
      context={context}
      filterConfigs={fields}
      // Review filters are always expanded, so we don't strictly need a 'mainFilterKey'
      // but passing one allows the grid to organize it correctly if we turn off alwaysExpanded.
      mainFilterKey="rating"
      sortOptions={reviewSortOptions}
      alwaysExpanded={true}
    />
  );
}
