import type { FilterGroupOption } from './type';

export const orderOptions: FilterGroupOption[] = [
  {
    groupLabel: 'Created Date',
    options: [
      { label: 'New→Old', urlInput: 'created-desc' },
      { label: 'Old→New', urlInput: 'created-asc' },
    ],
  },
  {
    groupLabel: 'Rating',
    options: [
      { label: 'High→Low', urlInput: 'rating-desc' },
      { label: 'Low→High', urlInput: 'rating-asc' },
    ],
  },
];
