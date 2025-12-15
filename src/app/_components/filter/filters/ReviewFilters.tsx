"use client";

import DropdownFilter from "../DropdownFilter";
import { useReviewFilterContext } from "~/app/_contexts/filter/ReviewFilterProvider";
import { reviewSortOptions } from "~/const";
import type { FilterOption } from "~/type";

export default function ReviewFilters() {
  const { rating, setRating, sort, setSort, handleSearch } =
    useReviewFilterContext();

  // dropdown options for all filters
  const ratingOptions: FilterOption[] = [
    { label: "1 star", urlInput: "1" },
    { label: "2 star", urlInput: "2" },
    { label: "3 star", urlInput: "3" },
    { label: "4 star", urlInput: "4" },
    { label: "5 star", urlInput: "5" },
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <form
      id="review-filters"
      onSubmit={handleSubmit}
      className="grid w-full grid-cols-2 gap-2 text-sm lg:gap-3"
    >
      {/* Filter Components */}
      <div className="contents">
        <DropdownFilter
          label="Rating"
          options={ratingOptions}
          isGroupOptions={false}
          value={rating}
          onChange={setRating}
          mode="multi"
        />
        <DropdownFilter
          label="Sort"
          options={reviewSortOptions}
          isGroupOptions={true}
          value={sort}
          onChange={setSort}
          mode="single"
        />
      </div>
    </form>
  );
}
