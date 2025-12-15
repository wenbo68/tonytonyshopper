"use client";

import { useMemo } from "react";
import {
  ClickablePill,
  UnclickablePill,
  PillContainer,
} from "../filter/FilterPill";
import { useReviewFilterContext } from "~/app/_contexts/ReviewFilterProvider";
import { reviewSortOptions } from "~/const";
import type { PillConfig } from "~/type";

export default function ReviewFilterPills() {
  const { rating, setRating, order, handleSearch } = useReviewFilterContext();

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
    if (order) {
      for (const group of reviewSortOptions) {
        const foundOption = group.options.find((opt) => opt.urlInput === order);
        if (foundOption) {
          sortLabel = `${group.groupLabel}: ${foundOption.label}`;
          break;
        }
      }
    }

    return { pillConfigs: configs, sortLabel };
  }, [rating, setRating, order, handleSearch]);

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
