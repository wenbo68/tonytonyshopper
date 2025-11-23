// src/app/_components/cart/CartMergeHandler.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { api } from "~/trpc/react";
import { useGuestCartStore } from "../../_hooks/useGuestCart";
import { useCartMergeStore } from "~/app/_hooks/useMergeCartStore";

export function CartMergeHandler() {
  const { data: session } = useSession();
  const { items, clearCart } = useGuestCartStore();
  const utils = api.useUtils();

  // 1. Use the new store
  const setIsMerging = useCartMergeStore((state) => state.setIsMerging);

  const mergeMutation = api.cart.merge.useMutation({
    onSuccess: async () => {
      // 2. Clear guest items
      clearCart();

      // 3. Wait for the database query to fully refresh BEFORE hiding the loader
      await utils.cart.get.invalidate();

      // 4. Now it's safe to show the cart
      setIsMerging(false);
    },
    onError: (error) => {
      console.error("Failed to merge cart:", error);
      setIsMerging(false); // Ensure we don't get stuck in loading on error
    },
  });

  useEffect(() => {
    // If user is logged in AND has guest items, a merge is needed
    if (session?.user && items.length > 0) {
      if (mergeMutation.isPending) return;

      // 5. Start loading immediately
      setIsMerging(true);
      mergeMutation.mutate(items);
    }
  }, [session, items, mergeMutation, setIsMerging]);

  return null;
}
