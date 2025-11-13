import { create } from "zustand";

// This is the 'DisplayCartItem' type from your cart page
type CartItem = {
  id: string; // productVariantId
  productId: string;
  name: string;
  price: string;
  images: string[] | null | undefined;
  quantity: number;
};

// --- DEFINE THE NEW STATE TYPE ---
type PreSelectedOptions = Record<string, string> | null;

type VariantModalState = {
  isOpen: boolean;
  mode: "add" | "edit" | null;
  productId: string | null;
  editingItem: CartItem | null;
  initialOptions: PreSelectedOptions; // <-- ADD THIS
  openModal: (
    productId: string,
    mode: "add" | "edit",
    item?: CartItem,
    initialOptions?: PreSelectedOptions, // <-- ADD THIS
  ) => void;
  closeModal: () => void;
};

export const useVariantModalStore = create<VariantModalState>((set) => ({
  isOpen: false,
  mode: null,
  productId: null,
  editingItem: null,
  initialOptions: null, // <-- ADD THIS
  openModal: (
    productId,
    mode,
    item = undefined,
    initialOptions = null, // <-- ADD THIS
  ) =>
    set({
      isOpen: true,
      productId,
      mode,
      editingItem: item,
      initialOptions: initialOptions, // <-- ADD THIS
    }),
  closeModal: () =>
    set({
      isOpen: false,
      productId: null,
      mode: null,
      editingItem: null,
      initialOptions: null, // <-- ADD THIS
    }),
}));
