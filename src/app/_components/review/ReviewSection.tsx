"use client"; // 1. Make this a Client Component

import ReviewFilters from "../filter/filters/ReviewFilters";
import AvgRating from "./rating/AvgRating";
import ReviewFilterPills from "../filter/filterPills/ReviewFilterPills";
import Reviews from "./reviews/Reviews";
import { ReviewFilterProvider } from "~/app/_contexts/filter/ReviewFilterProvider";

export default function ReviewSection() {
  return (
    <ReviewFilterProvider>
      <section className="flex flex-col gap-5 sm:gap-7">
        <AvgRating />
        <Reviews />
        {/* <WriteReview /> */}
      </section>
    </ReviewFilterProvider>
  );
}
