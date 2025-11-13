"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
// import { useCartStore } from '~/store/cart-store';
import { api } from "~/trpc/react";
import { useGuestCartStore } from "../../_hooks/useGuestCart";

/**
 * This component runs on every page.
 * It checks if a user has just logged in and has a guest cart.
 * If so, it merges the guest cart into their DB cart.
 */
export function CartMergeHandler() {
  const { data: session } = useSession();
  const { items, clearCart } = useGuestCartStore();

  const mergeMutation = api.cart.merge.useMutation({
    onSuccess: () => {
      // Clear the guest cart *after* successful merge
      clearCart();
    },
    onError: (error) => {
      console.error("Failed to merge cart:", error);
    },
  });

  useEffect(() => {
    // If user is logged in AND the guest cart has items
    if (session?.user && items.length > 0) {
      // Don't merge if a merge is already in progress
      if (mergeMutation.isPending) return;

      mergeMutation.mutate(items);
    }
  }, [session, items, mergeMutation]);

  // This component renders nothing
  return null;
}
