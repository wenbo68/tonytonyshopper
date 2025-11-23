// src/app/_hooks/useCartMergeStore.ts
import { create } from "zustand";

type CartMergeState = {
  isMerging: boolean;
  setIsMerging: (isMerging: boolean) => void;
};

export const useCartMergeStore = create<CartMergeState>((set) => ({
  isMerging: false,
  setIsMerging: (isMerging) => set({ isMerging }),
}));
