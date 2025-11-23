"use client";

import Filter from "../filter/Filter";
import { useReviewFilterContext } from "~/app/_contexts/ReviewFilterProvider";
import { reviewOrderOptions } from "~/const";
import type { FilterOption } from "~/type";

export default function ReviewFilters() {
  const { rating, setRating, order, setOrder, handleSearch } =
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
        <Filter
          label="Rating"
          options={ratingOptions}
          isGroupOptions={false}
          value={rating}
          onChange={setRating}
          mode="multi"
        />
        <Filter
          label="Order"
          options={reviewOrderOptions}
          isGroupOptions={true}
          value={order}
          onChange={setOrder}
          mode="single"
        />
      </div>
    </form>
  );
}
