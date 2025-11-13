// Path: ~/app/cart/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import Image from "next/image";
import Link from "next/link";
import { useGuestCartStore } from "../_hooks/useGuestCart";
import { formatCurrency } from "~/server/utils/product";
import { useState } from "react";
// --- 1. IMPORT THE NEW STORE ---
import { useVariantModalStore } from "../_hooks/useVariantModal";

// A type helper for our new unified cart item structure
type DisplayCartItem = {
  id: string; // This is now the productVariantId
  productId: string; // The parent product's ID (for linking)
  name: string; // Combined name, e.g., "Classic Tee - Red"
  price: string;
  images: string[] | null | undefined;
  quantity: number;
};

export default function CartPage() {
  const { data: session, status: sessionStatus } = useSession();
  const utils = api.useUtils();

  // --- 3. GET THE MODAL OPENER ---
  const openVariantModal = useVariantModalStore((state) => state.openModal);

  // === 2. Guest Cart Logic (unchanged) ===
  const guestCart = useGuestCartStore((state) => state.items);

  // === 3. Logged-in User (tRPC) Logic (unchanged) ===
  const { data: dbCart, isLoading: isDbCartLoading } = api.cart.get.useQuery(
    undefined,
    {
      enabled: sessionStatus === "authenticated",
    },
  );

  // === 4. Guest Product Fetching (unchanged) ===
  const guestVariantIds = guestCart.map((item) => item.productVariantId);
  const { data: guestVariants, isLoading: isGuestProductsLoading } =
    api.product.getVariantsByIds.useQuery(guestVariantIds, {
      enabled:
        sessionStatus === "unauthenticated" && guestVariantIds.length > 0,
    });

  // === 6. Render Logic (unchanged) ===
  let cartItems: DisplayCartItem[] = [];
  let isLoading = false;

  if (session?.user) {
    isLoading = isDbCartLoading;
    cartItems =
      dbCart?.map((item) => ({
        id: item.productVariant.id,
        productId: item.productVariant.product.id,
        name: `${item.productVariant.product.name} - ${item.productVariant.name}`,
        price: item.productVariant.price,
        images: item.productVariant.images,
        quantity: item.quantity,
      })) ?? [];
  } else {
    isLoading = isGuestProductsLoading;
    if (guestVariants) {
      cartItems = guestVariants.map((variant) => ({
        id: variant.id,
        productId: variant.product.id,
        name: `${variant.product.name} - ${variant.name}`,
        price: variant.price,
        images: variant.images,
        quantity:
          guestCart.find((i) => i.productVariantId === variant.id)?.quantity ??
          0,
      }));
    }
  }

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-8 text-center">Loading cart...</div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold">Your Cart is Empty</h1>
        <Link
          href="/product/all"
          className="mt-4 inline-block text-indigo-600 hover:underline"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  const total = cartItems.reduce(
    (acc, item) => acc + parseFloat(item.price) * item.quantity,
    0,
  );

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Shopping Cart</h1>
      <ul
        role="list"
        className="divide-y divide-gray-200 border-t border-b border-gray-200"
      >
        {cartItems.map((item) => (
          <li key={item.id} className="flex py-6">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-gray-200">
              <Image
                src={item.images?.[0] ?? "https://placehold.co/100x100.png"}
                alt={item.name ?? "Product"}
                width={100}
                height={100}
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="ml-4 flex flex-1 flex-col">
              <div>
                <div className="flex justify-between text-base font-medium">
                  <h3>
                    <Link href={`/product/${item.productId}`}>{item.name}</Link>
                  </h3>
                  <p className="ml-4">{formatCurrency(item.price)}</p>
                </div>
              </div>
              <div className="flex flex-1 items-end justify-between text-sm">
                <p className="text-gray-500">Qty {item.quantity}</p>
                <div className="flex">
                  {/* --- 6. UPDATE THE EDIT BUTTON --- */}
                  <button
                    type="button"
                    onClick={() =>
                      openVariantModal(item.productId, "edit", item)
                    }
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-between text-base font-medium">
        <p>Subtotal</p>
        <p>{formatCurrency(total.toString())}</p>
      </div>
      <p className="mt-0.5 text-sm text-gray-500">
        Shipping and taxes calculated at checkout.
      </p>
      <div className="mt-6">
        <Link
          href="/checkout"
          className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Checkout
        </Link>
      </div>
    </main>
  );
}
