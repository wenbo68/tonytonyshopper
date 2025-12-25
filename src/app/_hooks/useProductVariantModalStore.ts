import { create } from "zustand";
import type { ProductAndVariants } from "~/type";

type variantAndQuantity = {
  variantId: string;
  quantity: number;
};

type ProductVariantModalState = {
  isOpen: boolean;
  mode: "add" | "edit" | null;
  product: ProductAndVariants | null;
  productId: string | null;
  variantAndQuantity: variantAndQuantity | null;
  openModal: (
    product: ProductAndVariants | string, // Can now accept a string ID
    mode: "add" | "edit",
    item?: variantAndQuantity,
  ) => void;
  closeModal: () => void;
};

export const useProductVariantModalStore = create<ProductVariantModalState>(
  (set) => ({
    isOpen: false,
    mode: null,
    product: null,
    productId: null,
    variantAndQuantity: null,
    openModal: (productOrId, mode, variantAndQuantity = undefined) => {
      const isId = typeof productOrId === "string";
      set({
        isOpen: true,
        productId: isId ? productOrId : null,
        product: isId ? null : productOrId,
        mode,
        variantAndQuantity,
      });
    },
    closeModal: () =>
      set({
        isOpen: false,
        productId: null,
        product: null,
        mode: null,
        variantAndQuantity: null,
      }),
  }),
);
