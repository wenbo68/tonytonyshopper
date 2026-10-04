// src/app/_components/CartMergeHandler.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { api } from "~/trpc/react";
import { useGuestCartStore } from "../_hooks/useGuestCartStore";
import { useCartMergeStore } from "~/app/_hooks/useMergeCartStore";
import { customToast } from "./toast";

/**
 * When a guest with items in their browser cart signs in, copy those items
 * into their account cart (once), then clear the browser cart.
 */
export function CartMergeHandler() {
  const { data: session } = useSession();
  const { items, clearCart } = useGuestCartStore();
  const utils = api.useUtils();

  const setIsMerging = useCartMergeStore((state) => state.setIsMerging);
  const mergeFailed = useCartMergeStore((state) => state.mergeFailed);
  const setMergeFailed = useCartMergeStore((state) => state.setMergeFailed);

  const { mutate, isPending } = api.cart.merge.useMutation({
    onSuccess: async (result) => {
      clearCart();
      // Wait for the account cart to refresh before hiding the loader.
      await utils.cart.get.invalidate();
      setIsMerging(false);
      if (result.skipped.length > 0) {
        customToast.error(
          `${result.skipped.length} saved item(s) are no longer available and were removed from your cart.`,
        );
      }
    },
    onError: (error) => {
      console.error("Failed to merge cart:", error);
      // Remember the failure so the effect below doesn't retry in a loop.
      setMergeFailed(true);
      setIsMerging(false);
      customToast.error(
        "Couldn't move your saved cart items into your account. They're still saved in this browser.",
      );
    },
  });

  // Allow a fresh attempt after the user signs out and back in.
  useEffect(() => {
    if (!session?.user && mergeFailed) setMergeFailed(false);
  }, [session, mergeFailed, setMergeFailed]);

  useEffect(() => {
    if (!session?.user || items.length === 0 || isPending || mergeFailed)
      return;
    setIsMerging(true);
    mutate(items);
  }, [session, items, isPending, mergeFailed, mutate, setIsMerging]);

  return null;
}
