// src/app/_hooks/useMergeCartStore.ts
import { create } from "zustand";

type CartMergeState = {
  /** True while guest cart items are being copied into the signed-in user's cart. */
  isMerging: boolean;
  /** True once a merge attempt failed, so we stop retrying and show the cart anyway. */
  mergeFailed: boolean;
  setIsMerging: (isMerging: boolean) => void;
  setMergeFailed: (mergeFailed: boolean) => void;
};

export const useCartMergeStore = create<CartMergeState>((set) => ({
  isMerging: false,
  mergeFailed: false,
  setIsMerging: (isMerging) => set({ isMerging }),
  setMergeFailed: (mergeFailed) => set({ mergeFailed }),
}));
