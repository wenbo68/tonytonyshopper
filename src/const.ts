import type { FilterGroupOption } from "./type";

export const reviewOrderOptions: FilterGroupOption[] = [
  {
    groupLabel: "Created Date",
    options: [
      { label: "New→Old", urlInput: "created-desc" },
      { label: "Old→New", urlInput: "created-asc" },
    ],
  },
  {
    groupLabel: "Rating",
    options: [
      { label: "High→Low", urlInput: "rating-desc" },
      { label: "Low→High", urlInput: "rating-asc" },
    ],
  },
];

export const productOrderOptions: FilterGroupOption[] = [
  {
    groupLabel: "Price",
    options: [
      { label: "Low→High", urlInput: "price-asc" },
      { label: "High→Low", urlInput: "price-desc" },
    ],
  },
  {
    groupLabel: "Rating",
    options: [
      { label: "Low→High", urlInput: "rating-asc" },
      { label: "High→Low", urlInput: "rating-desc" },
    ],
  },
  {
    groupLabel: "Date Added",
    options: [
      { label: "New→Old", urlInput: "created-desc" },
      { label: "Old→New", urlInput: "created-asc" },
    ],
  },
  {
    groupLabel: "Name",
    options: [
      { label: "A→Z", urlInput: "name-asc" },
      { label: "Z→A", urlInput: "name-desc" },
    ],
  },
];
