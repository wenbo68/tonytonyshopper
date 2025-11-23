"use client";

import { useMemo } from "react";
import {
  ClickableLabel,
  UnclickableLabel,
  LabelContainer,
} from "../filter/Label";
import { useReviewFilterContext } from "~/app/_contexts/ReviewFilterProvider";
import { reviewOrderOptions } from "~/const";

type ActiveLabel = {
  key: string;
  label: string;
  type: "rating";
  onRemove?: () => void;
  className?: string;
};

export default function ReviewLabels(
  {
    //   filterOptions,
    // }: {
    //   filterOptions: FilterOptionsFromDb;
  },
) {
  const { rating, setRating, order, handleSearch } = useReviewFilterContext();

  const { activeLabels, orderLabel } = useMemo(() => {
    const activeLabels: ActiveLabel[] = [];

    // Rating
    rating.forEach((rtg) => {
      activeLabels.push({
        key: `rating-${rtg}`,
        label: `${rtg} Star`,
        type: "rating",
        onRemove: () => {
          const newRating = rating.filter((r) => r !== rtg);
          setRating(newRating);
          handleSearch({ rating: newRating });
        },
      });
    });

    // Order Label
    let orderLabel: string | null = null;
    if (order) {
      for (const group of reviewOrderOptions) {
        const foundOption = group.options.find((opt) => opt.urlInput === order);
        if (foundOption) {
          orderLabel = `${group.groupLabel}: ${foundOption.label}`;
          break;
        }
      }
    }

    return { activeLabels, orderLabel };
  }, [rating, setRating, order, handleSearch]);

  return (
    <LabelContainer>
      {activeLabels.length === 0 ? (
        orderLabel ? (
          <UnclickableLabel label={orderLabel} colorType="order" />
        ) : (
          <UnclickableLabel label={"Empty Search"} colorType="order" />
        )
      ) : (
        <>
          {activeLabels.map((label) => {
            return label.onRemove ? (
              <ClickableLabel
                key={label.key}
                label={label.label}
                colorType={label.type}
                onRemove={label.onRemove}
              />
            ) : (
              <UnclickableLabel
                key={label.key}
                label={label.label}
                colorType={label.type}
              />
            );
          })}
          {orderLabel && (
            <UnclickableLabel label={orderLabel} colorType="order" />
          )}
        </>
      )}
    </LabelContainer>
  );
}
