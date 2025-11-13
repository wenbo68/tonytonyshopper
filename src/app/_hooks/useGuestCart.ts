import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type CartItem = {
  productVariantId: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productVariantId: string) => void;
  updateQuantity: (productVariantId: string, quantity: number) => void;
  clearCart: () => void;
};

export const useGuestCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.productVariantId === item.productVariantId,
          );
          if (existingItem) {
            // Update quantity
            return {
              items: state.items.map((i) =>
                i.productVariantId === item.productVariantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          } else {
            // Add new item
            return { items: [...state.items, item] };
          }
        });
      },
      removeItem: (productVariantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => i.productVariantId !== productVariantId,
          ),
        }));
      },
      updateQuantity: (productVariantId, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productVariantId === productVariantId ? { ...i, quantity } : i,
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "guest-cart-storage", // Name in localStorage
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
