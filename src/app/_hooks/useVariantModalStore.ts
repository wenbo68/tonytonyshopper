import { create } from "zustand";
import type { ProductAndVariants } from "~/type";

type EditedItem = {
  variantId: string;
  // name: string;
  // price: string;
  // images: string[] | null | undefined;
  quantity: number;
};

// type PreSelectedOptions = Record<string, string>;

type ProductVariantModalState = {
  isOpen: boolean;
  mode: "add" | "edit" | null;
  product: ProductAndVariants | null;
  editedItem: EditedItem | null;
  // initialOptions: PreSelectedOptions | null;
  openModal: (
    product: ProductAndVariants,
    mode: "add" | "edit",
    item?: EditedItem,
    // initialOptions?: PreSelectedOptions,
  ) => void;
  closeModal: () => void;
};

export const useProductVariantModalStore = create<ProductVariantModalState>(
  (set) => ({
    isOpen: false,
    mode: null,
    product: null,
    editedItem: null,
    // initialOptions: null,
    openModal: (
      product,
      mode,
      editedItem = undefined,
      // initialOptions = undefined,
    ) =>
      set({
        isOpen: true,
        product,
        mode,
        editedItem,
        // initialOptions,
      }),
    closeModal: () =>
      set({
        isOpen: false,
        product: null,
        mode: null,
        editedItem: null,
        // initialOptions: null,
      }),
  }),
);
