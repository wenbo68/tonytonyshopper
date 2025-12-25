"use client"; // 1. Make this a Client Component

import ReviewFilters from "../filter/filters/ReviewFilters";
import AvgRating from "./rating/AvgRating";
import ReviewFilterPills from "../filter/filterPills/ReviewFilterPills";
import Reviews from "./reviews/Reviews";
import { ReviewFilterProvider } from "~/app/_contexts/filter/ReviewFilterProvider";

export default function ReviewSection() {
  return (
    <ReviewFilterProvider>
      <section className="flex flex-col gap-5">
        {/* title */}
        <div className="flex flex-col gap-0">
          <h2 className="text-lg font-semibold text-gray-300">Reviews</h2>
          {/* <p className="text-sm text-gray-500">
            See what others are saying... or say something yourself!
          </p> */}
        </div>

        <AvgRating />
        <ReviewFilters />
        <ReviewFilterPills />
        <Reviews />
        {/* <WriteReview /> */}
      </section>
    </ReviewFilterProvider>
  );
}
