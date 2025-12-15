"use client";

import { useMemo } from "react";
import {
  ClickablePill,
  UnclickablePill,
  PillContainer,
} from "../filter/FilterPill";
import { productSortOptions } from "~/const";
import { useProductFilterContext } from "~/app/_contexts/ProductFilterProvider";
import type { FilterOption, PillConfig } from "~/type";

export default function ProductFilterPills({
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

  const { pillConfigs, sortLabel } = useMemo(() => {
    const configs: PillConfig[] = [];

    if (name) {
      configs.push({
        key: "name",
        label: `Name: ${name}`,
        color: 1,
        onRemove: () => {
          setName("");
          handleSearch({ name: "" });
        },
      });
    }

    category.forEach((catId) => {
      // Find the label corresponding to the ID
      const option = categoryOptions.find((opt) => opt.urlInput === catId);
      configs.push({
        key: `category-${catId}`,
        label: `Category: ${option ? option.label : catId}`, // Fallback to ID if label not found
        color: 2,
        onRemove: () => {
          const newCategory = category.filter((c) => c !== catId);
          setCategory(newCategory);
          handleSearch({ categories: newCategory });
        },
      });
    });

    stock.forEach((item) => {
      configs.push({
        key: `stock-${item}`,
        label: `Stock: ${item}`,
        color: 3,
        onRemove: () => {
          const newStock = stock.filter((s) => s !== item);
          setStock(newStock);
          handleSearch({ stock: newStock });
        },
      });
    });

    if (minPrice) {
      configs.push({
        key: "min-price",
        label: `Min Price: ${minPrice}`,
        color: 4,
        onRemove: () => {
          setminPrice("");
          handleSearch({ minPrice: "" });
        },
      });
    }
    if (maxPrice) {
      configs.push({
        key: "max-price",
        label: `Max Price: ${maxPrice}`,
        color: 4,
        onRemove: () => {
          setmaxPrice("");
          handleSearch({ maxPrice: "" });
        },
      });
    }

    if (ratingMin) {
      configs.push({
        key: "rating-min",
        label: `Rating Min: ${ratingMin}`,
        color: 5,
        onRemove: () => {
          setRatingMin("");
          handleSearch({ ratingMin: "" });
        },
      });
    }
    if (ratingMax) {
      configs.push({
        key: "rating-max",
        label: `Rating Max: ${ratingMax}`,
        color: 5,
        onRemove: () => {
          setRatingMax("");
          handleSearch({ ratingMax: "" });
        },
      });
    }

    let sortLabel: string | null = null;
    if (order) {
      for (const group of productSortOptions) {
        const foundOption = group.options.find((opt) => opt.urlInput === order);
        if (foundOption) {
          sortLabel = `${group.groupLabel}: ${foundOption.label}`;
          break;
        }
      }
    }

    return { pillConfigs: configs, sortLabel };
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
