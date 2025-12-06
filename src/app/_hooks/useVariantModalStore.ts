import { create } from "zustand";
import type { ProductAndVariants } from "~/type";

// This is the 'DisplayCartItem' type from your cart page
type CartItem = {
  variantId: string;
  name: string;
  price: string;
  images: string[] | null | undefined;
  quantity: number;
};

// --- DEFINE THE NEW STATE TYPE ---
type PreSelectedOptions = Record<string, string>;

type ProductVariantModalState = {
  isOpen: boolean;
  mode: "add" | "edit" | null;
  product: ProductAndVariants | null;
  editingItem: CartItem | null;
  initialOptions: PreSelectedOptions | null;
  openModal: (
    // productId: string,
    product: ProductAndVariants, // <-- ADDED: Accept product data
    mode: "add" | "edit",
    item?: CartItem,
    initialOptions?: PreSelectedOptions, // <-- ADD THIS
  ) => void;
  closeModal: () => void;
};

export const useProductVariantModalStore = create<ProductVariantModalState>(
  (set) => ({
    isOpen: false,
    mode: null,
    // productId: null,
    product: null,
    editingItem: null,
    initialOptions: null, // <-- ADD THIS
    openModal: (
      // productId,
      product,
      mode,
      item = undefined,
      initialOptions = undefined, // <-- ADD THIS
    ) =>
      set({
        isOpen: true,
        // productId,
        product, // Store it
        mode,
        editingItem: item,
        initialOptions, // <-- ADD THIS
      }),
    closeModal: () =>
      set({
        isOpen: false,
        // productId: null,
        product: null, // Clear it
        mode: null,
        editingItem: null,
        initialOptions: null, // <-- ADD THIS
      }),
  }),
);
