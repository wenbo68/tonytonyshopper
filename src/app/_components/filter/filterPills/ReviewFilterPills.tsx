"use client";

import { useMemo } from "react";
import { ClickablePill, UnclickablePill, PillContainer } from "../FilterPill";
import { useReviewFilterContext } from "~/app/_contexts/filter/ReviewFilterProvider";
import { reviewSortOptions } from "~/const";
import type { PillConfig } from "~/type";

export default function ReviewFilterPills() {
  const { rating, setRating, sort, handleSearch } = useReviewFilterContext();

  const { pillConfigs, sortLabel } = useMemo(() => {
    const configs: PillConfig[] = [];

    // Rating
    rating.forEach((rtg) => {
      configs.push({
        key: `rating-${rtg}`,
        label: `${rtg} Star`,
        color: 2,
        onRemove: () => {
          const newRating = rating.filter((r) => r !== rtg);
          setRating(newRating);
          handleSearch({ rating: newRating });
        },
      });
    });

    // Order Label
    let sortLabel: string | null = null;
    if (sort) {
      for (const group of reviewSortOptions) {
        const foundOption = group.options.find((opt) => opt.urlInput === sort);
        if (foundOption) {
          sortLabel = `${group.groupLabel}: ${foundOption.label}`;
          break;
        }
      }
    }

    return { pillConfigs: configs, sortLabel };
  }, [rating, setRating, sort, handleSearch]);

  return (
    <PillContainer>
      <>
        {pillConfigs.map((config) => {
          return config.onRemove ? (
            <ClickablePill
              key={config.key}
              label={config.label}
              color={config.color}
              onRemove={config.onRemove}
            />
          ) : (
            <UnclickablePill
              key={config.key}
              label={config.label}
              color={config.color}
            />
          );
        })}
        <UnclickablePill label={sortLabel ?? "Empty Search"} color="gray" />
      </>
    </PillContainer>
  );
}
