"use client";

import { useReviewFilterContext } from "~/app/_contexts/filter/ReviewFilterProvider";
import { reviewSortOptions } from "~/const";
import { GenericFilterPills, type BasePillConfig } from "./GenericFilterPills";
// import { GenericFilterPills, type PillDefinition } from "./GenericFilterPills";

export default function ReviewFilterPills() {
  const context = useReviewFilterContext();

  // Define how to render the pills
  // Typescript will ensure keys match the Review Filters schema
  const definitions: Record<
    "rating",
    BasePillConfig<typeof context.filters>
  > = {
    rating: { getLabelFromFilterState: (val) => `${val} Star`, color: 2 },
  };

  return (
    <GenericFilterPills
      context={context}
      basePillConfigs={definitions}
      sortOptions={reviewSortOptions}
    />
  );
}
