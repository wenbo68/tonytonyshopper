import type { FilterGroupOption } from "./type";

export const reviewSortOptions: FilterGroupOption[] = [
  {
    groupLabel: "Date Posted",
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

export const defaultReviewSort: string = "created-desc";

export const productSortOptions: FilterGroupOption[] = [
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

export const defaultProductSort: string = "created-desc";

export const orderSortOptions: FilterGroupOption[] = [
  {
    groupLabel: "Date",
    options: [
      { label: "New→Old", urlInput: "date-desc" },
      { label: "Old→New", urlInput: "date-asc" },
    ],
  },
  {
    groupLabel: "Total",
    options: [
      { label: "Low→High", urlInput: "price-asc" },
      { label: "High→Low", urlInput: "price-desc" },
    ],
  },
];

export const defaultOrderSort: string = "date-desc";

export const adminOrderSortOptions: FilterGroupOption[] = [
  ...orderSortOptions,
  {
    groupLabel: "Customer",
    options: [
      { label: "Name A→Z", urlInput: "name-asc" },
      { label: "Name Z→A", urlInput: "name-desc" },
      { label: "Email A→Z", urlInput: "email-asc" },
      { label: "Email Z→A", urlInput: "email-desc" },
    ],
  },
];

export const colorClassMap = {
  1: "bg-red-500/20 text-red-300 ring-red-500/30",
  2: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  3: "bg-lime-500/20 text-lime-300 ring-lime-500/30",
  4: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
  5: "bg-sky-500/20 text-sky-300 ring-sky-500/30",
  6: "bg-blue-500/20 text-blue-300 ring-blue-500/30",
  7: "bg-indigo-500/20 text-indigo-300 ring-indigo-500/30",
  8: "bg-violet-500/20 text-violet-300 ring-violet-500/30",
  gray: "bg-gray-500/20 text-gray-300 ring-gray-500/30",
};
