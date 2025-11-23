"use client";

import { useMemo } from "react";
import {
  ClickableLabel,
  UnclickableLabel,
  LabelContainer,
} from "../filter/Label";
import { productOrderOptions } from "~/const";
import { useProductFilterContext } from "~/app/_contexts/ProductFilterProvider";
import type { FilterOption } from "~/type";

type ActiveLabel = {
  key: string;
  label: string;
  type: "name" | "category" | "stock" | "price" | "rating" | "order";
  onRemove?: () => void;
  className?: string;
};

export default function ProductLabels({
  categoryOptions,
}: {
  categoryOptions: FilterOption[];
}) {
  const {
    name,
    category,
    minPrice,
    maxPrice,
    ratingMin,
    ratingMax,
    stock,
    order,
    setName,
    setCategory,
    setminPrice,
    setmaxPrice,
    setRatingMin,
    setRatingMax,
    setStock,
    handleSearch,
  } = useProductFilterContext();

  const { activeLabels, orderLabel } = useMemo(() => {
    const activeLabels: ActiveLabel[] = [];

    // 1. Name Label
    if (name) {
      activeLabels.push({
        key: "name",
        label: `Name: ${name}`,
        type: "name",
        onRemove: () => {
          setName("");
          handleSearch({ name: "" });
        },
      });
    }

    // 2. Category Labels
    category.forEach((catId) => {
      // Find the label corresponding to the ID
      const option = categoryOptions.find((opt) => opt.urlInput === catId);
      activeLabels.push({
        key: `category-${catId}`,
        label: option ? option.label : catId, // Fallback to ID if label not found
        type: "category",
        onRemove: () => {
          const newCategory = category.filter((c) => c !== catId);
          setCategory(newCategory);
          handleSearch({ categories: newCategory });
        },
      });
    });

    // 3. Price Label
    if (minPrice || maxPrice) {
      const min = minPrice || "0";
      const max = maxPrice || "INF";
      activeLabels.push({
        key: "price",
        label: `Price: ${min}↔${max}`,
        type: "price",
        onRemove: () => {
          setminPrice("");
          setmaxPrice("");
          handleSearch({ minPrice: "", maxPrice: "" });
        },
      });
    }

    // 4. Rating Label
    if (ratingMin || ratingMax) {
      const min = ratingMin || "0";
      const max = ratingMax || "5";
      activeLabels.push({
        key: "rating",
        label: `Rating: ${min}↔${max}`,
        type: "rating",
        onRemove: () => {
          setRatingMin("");
          setRatingMax("");
          handleSearch({ ratingMin: "", ratingMax: "" });
        },
      });
    }

    // 5. Stock Labels
    stock.forEach((item) => {
      activeLabels.push({
        key: `stock-${item}`,
        label: `Stock: ${item}`,
        type: "stock",
        onRemove: () => {
          const newStock = stock.filter((s) => s !== item);
          setStock(newStock);
          handleSearch({ stock: newStock });
        },
      });
    });

    // Order Label
    let orderLabel: string | null = null;
    if (order) {
      for (const group of productOrderOptions) {
        const foundOption = group.options.find((opt) => opt.urlInput === order);
        if (foundOption) {
          orderLabel = `${group.groupLabel}: ${foundOption.label}`;
          break;
        }
      }
    }

    return { activeLabels, orderLabel };
  }, [
    name,
    category,
    minPrice,
    maxPrice,
    ratingMin,
    ratingMax,
    stock,
    order,
    categoryOptions,
    setName,
    setCategory,
    setminPrice,
    setmaxPrice,
    setRatingMin,
    setRatingMax,
    setStock,
    handleSearch,
  ]);

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
