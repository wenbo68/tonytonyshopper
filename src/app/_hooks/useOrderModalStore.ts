import { create } from "zustand";
import type { OrderAndOrderItemsAndVariantAndProduct } from "~/type";

type ProductVariantModalState = {
  isOpen: boolean;
  order: OrderAndOrderItemsAndVariantAndProduct | null;
  openModal: (order: OrderAndOrderItemsAndVariantAndProduct) => void;
  closeModal: () => void;
};

export const useProductVariantModalStore = create<ProductVariantModalState>(
  (set) => ({
    isOpen: false,
    order: null,
    openModal: (order) =>
      set({
        isOpen: true,
        order,
      }),
    closeModal: () =>
      set({
        isOpen: false,
        order: null,
      }),
  }),
);
