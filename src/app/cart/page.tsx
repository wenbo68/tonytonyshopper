"use client";

import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import Image from "next/image";
import Link from "next/link";
import { useGuestCartStore } from "../_hooks/useGuestCartStore";
import { formatCurrency } from "~/server/utils/product";
import { useState } from "react";
import { useProductVariantModalStore } from "../_hooks/useVariantModalStore";
import { useCartMergeStore } from "../_hooks/useMergeCartStore";
import type { VariantAndProduct } from "~/type";
import { FaPen, FaTrash } from "react-icons/fa";

type CartItem = {
  variant: VariantAndProduct;
  quantity: number;
};

export default function CartPage() {
  // ==== hooks ====
  const { data: session, status: sessionStatus } = useSession();
  const utils = api.useUtils();
  const openVariantModal = useProductVariantModalStore(
    (state) => state.openModal,
  );

  // ==== states ====
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // ==== db mutations ====
  const removeUserItemMutation = api.cart.remove.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
    },
  });
  const createCheckoutMutation = api.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError("Failed to get checkout URL. Please try again.");
      }
    },
    onError: (err) => {
      setCheckoutError(err.message);
    },
  });

  // ==== db queries ====
  // user cart
  const { data: userCart, isFetching: isUserCartFetching } =
    api.cart.get.useQuery(undefined, {
      enabled: sessionStatus === "authenticated",
      staleTime: 0,
      refetchOnWindowFocus: false,
    });
  // guest cart: get ids from global state -> use ids to fetch details from db
  const { items: guestCartItems, removeItem: removeGuestItem } =
    useGuestCartStore();
  const guestVariantIds = guestCartItems.map((item) => item.productVariantId);
  const { data: guestVariants, isFetching: isGuestVariantsFetching } =
    api.product.getVariantsByIds.useQuery(guestVariantIds, {
      enabled:
        sessionStatus === "unauthenticated" && guestVariantIds.length > 0,
      staleTime: 0,
      refetchOnWindowFocus: false,
    });

  // is merging guest/user cart?
  const isMerging = useCartMergeStore((state) => state.isMerging);

  // ==== Fill cartItems with user/guest cart items ====
  let cartItems: CartItem[] = [];
  let showLoading = false;

  if (session?.user) {
    const isPendingMerge = guestCartItems.length > 0;
    showLoading = isUserCartFetching || isMerging || isPendingMerge;

    cartItems =
      userCart?.map((item) => ({
        variant: item.productVariant,
        quantity: item.quantity,
      })) ?? [];
  } else {
    showLoading = isGuestVariantsFetching;

    if (guestVariants) {
      const guestVariantMap = new Map(guestVariants.map((v) => [v.id, v]));

      cartItems = [...guestCartItems]
        .reverse()
        .map((item) => {
          const guestVariant = guestVariantMap.get(item.productVariantId);
          if (!guestVariant) return null;

          return {
            variant: guestVariant,
            quantity: item.quantity,
          };
        })
        .filter((item): item is CartItem => item !== null);
    }
  }

  // ==== conditional rendering ====
  if (sessionStatus === "loading" || showLoading) {
    return (
      <div className="container mx-auto py-8 text-center">Loading cart...</div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold text-gray-200">Your Cart is Empty</h1>
        <Link
          href="/product/all"
          className="mt-4 inline-block text-indigo-400 hover:underline"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  // ==== Handlers ====
  const handleRemoveCartItem = (variantId: string) => {
    if (session?.user) {
      removeUserItemMutation.mutate({ productVariantId: variantId });
    } else {
      removeGuestItem(variantId);
    }
  };
  const handleCheckout = () => {
    setCheckoutError(null);
    const itemsToCheckout = cartItems.map((item) => ({
      productVariantId: item.variant.id,
      quantity: item.quantity,
    }));
    createCheckoutMutation.mutate(itemsToCheckout);
  };

  // ==== Helpers ====
  const formatOptions = (options: Record<string, string> | null) => {
    if (!options) return "";
    return Object.entries(options)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  // ==== Constants ====
  const subtotal = cartItems.reduce(
    (acc, item) => acc + parseFloat(item.variant.price) * item.quantity,
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-300">Shopping Cart</h1>
        <span className="text-sm font-medium text-gray-400">
          {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"}
        </span>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 gap-3 space-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
        {cartItems.map((item) => {
          const variant = item.variant;
          const quantity = item.quantity;
          const image =
            variant.images?.[0] ??
            "https://placehold.co/600x600/eee/ccc.png?text=No+Image";

          return (
            <div key={variant.id} className="flex flex-col gap-2">
              <div className="relative overflow-hidden rounded">
                <Link href={`/product/${variant.product.id}`}>
                  <Image
                    src={image}
                    alt={variant.product.name}
                    width={600}
                    height={600}
                    className="aspect-square h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </Link>

                {/* Edit Button (Top-Left) */}
                <button
                  onClick={() =>
                    openVariantModal(variant.product, "edit", {
                      variantId: variant.id,
                      quantity,
                    })
                  }
                  className="absolute top-2 left-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/60 text-gray-100 backdrop-blur-sm transition-colors hover:bg-black/80"
                  title="Edit Item"
                >
                  <FaPen size={12} />
                </button>

                {/* Delete Button (Top-Right) */}
                <button
                  onClick={() => handleRemoveCartItem(variant.id)}
                  className="absolute top-2 right-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/60 text-gray-100 backdrop-blur-sm transition-colors hover:bg-black/80"
                  title="Remove Item"
                >
                  <FaTrash size={12} />
                </button>

                {/* Price Tag (Bottom-Left) */}
                <div className="absolute bottom-2 left-2 z-10 rounded bg-black/60 px-2 py-1 text-xs font-bold text-gray-100 backdrop-blur-sm">
                  {formatCurrency(variant.price)} x{quantity}
                </div>
              </div>

              <div className="flex flex-col gap-0 px-1">
                {/* Product Name */}
                <Link
                  href={`/product/${variant.product.id}`}
                  className="line-clamp-1 text-sm font-semibold text-gray-300 hover:text-blue-400"
                >
                  {variant.product.name}
                </Link>
                {/* Options */}
                <p className="line-clamp-1 text-xs text-gray-500 capitalize">
                  {formatOptions(variant.options)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Section */}
      <div className="sticky bottom-0 z-20 mt-auto border-t border-gray-800 bg-gray-950/90 py-4 backdrop-blur-md sm:relative">
        <div className="mx-auto flex max-w-lg flex-col gap-3 rounded p-1">
          <div className="flex justify-between text-lg font-bold text-gray-300">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal.toString())}</span>
          </div>
          <p className="text-center text-xs text-gray-500">
            Shipping and taxes calculated at checkout.
          </p>
          <button
            onClick={handleCheckout}
            disabled={createCheckoutMutation.isPending}
            className="w-full cursor-pointer rounded bg-indigo-600 py-3 font-semibold text-gray-300 transition-colors hover:bg-indigo-700 disabled:cursor-default disabled:bg-indigo-700"
          >
            {createCheckoutMutation.isPending
              ? "Processing..."
              : "Checkout via Stripe"}
          </button>
          {checkoutError && (
            <p className="text-center text-sm text-red-500">{checkoutError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
