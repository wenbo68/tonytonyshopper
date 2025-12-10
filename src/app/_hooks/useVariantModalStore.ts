import { create } from "zustand";
import type { ProductAndVariants } from "~/type";

type EditedItem = {
  variantId: string;
  quantity: number;
};

type ProductVariantModalState = {
  isOpen: boolean;
  mode: "add" | "edit" | null;
  product: ProductAndVariants | null;
  editedItem: EditedItem | null;
  openModal: (
    product: ProductAndVariants,
    mode: "add" | "edit",
    item?: EditedItem,
  ) => void;
  closeModal: () => void;
};

export const useProductVariantModalStore = create<ProductVariantModalState>(
  (set) => ({
    isOpen: false,
    mode: null,
    product: null,
    editedItem: null,
    openModal: (product, mode, editedItem = undefined) =>
      set({
        isOpen: true,
        product,
        mode,
        editedItem,
      }),
    closeModal: () =>
      set({
        isOpen: false,
        product: null,
        mode: null,
        editedItem: null,
      }),
  }),
);
