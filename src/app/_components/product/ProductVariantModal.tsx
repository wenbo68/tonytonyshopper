"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { api, type RouterOutputs } from "~/trpc/react";
import { useProductVariantModalStore } from "~/app/_hooks/useVariantModalStore";
import { formatCurrency, formatNumber } from "~/server/utils/product";
import { useSession } from "next-auth/react";
import { useGuestCartStore } from "~/app/_hooks/useGuestCartStore";
import Link from "next/link";
import { FaPen } from "react-icons/fa";
import StarRating from "../rating/StarRating";
import { Dropdown } from "../Dropdown";

// Get tRPC types
type Product = RouterOutputs["product"]["getById"];
type Variant = NonNullable<Product>["variants"][0];

export function ProductVariantModal() {
  const { data: session } = useSession();
  const utils = api.useUtils();

  // === 1. Global Modal State ===
  const { isOpen, closeModal, mode, editedItem, product } =
    useProductVariantModalStore();

  // === 2. Internal Component State ===
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);

  // === 4. Guest Cart Mutations ===
  const addGuestItem = useGuestCartStore((state) => state.addItem);
  const updateGuestItem = useGuestCartStore((state) => state.updateQuantity);
  const removeGuestItem = useGuestCartStore((state) => state.removeItem);

  // === 5. Logged-in (tRPC) Mutations ===
  const { mutate: addItem, isPending: isAdding } = api.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      closeModal();
    },
  });

  const { mutate: updateItem, isPending: isUpdating } =
    api.cart.updateItem.useMutation({
      onSuccess: async () => {
        await utils.cart.get.invalidate();
        closeModal();
      },
    });

  const { mutate: updateQuantity, isPending: isUpdatingQty } =
    api.cart.updateQuantity.useMutation({
      onSuccess: async () => {
        await utils.cart.get.invalidate();
        closeModal();
      },
    });

  const isPending = isAdding || isUpdating || isUpdatingQty;

  // === 6. Effects to sync state when modal opens ===
  // This effect derives all available options (like on product page)
  const options = useMemo(() => {
    if (!product || !product.variants) return {};
    const opts: Record<string, Set<string>> = {};
    for (const variant of product.variants) {
      if (variant.options) {
        Object.entries(variant.options).forEach(([key, value]) => {
          if (!opts[key]) opts[key] = new Set();
          opts[key].add(value);
        });
      }
    }
    return Object.fromEntries(
      Object.entries(opts).map(([key, valueSet]) => [
        key,
        Array.from(valueSet),
      ]),
    );
  }, [product]);

  // This effect finds the currently selected variant based on options
  const selectedVariant = useMemo(() => {
    if (!product?.variants) return null;
    return product.variants.find((variant) => {
      if (!variant.options) return false;
      return Object.entries(selectedOptions).every(
        ([key, value]) => variant.options![key] === value,
      );
    });
  }, [selectedOptions, product?.variants]);

  // This effect pre-fills the state when the modal opens
  useEffect(() => {
    if (isOpen && product) {
      if (mode === "edit" && editedItem) {
        const itemVariant = product.variants.find(
          (v) => v.id === editedItem.variantId,
        );
        setSelectedOptions(itemVariant?.options ?? {});
        setQuantity(editedItem.quantity);
      } else if (mode === "add") {
        setSelectedOptions(product.variants[0]?.options ?? {});
        setQuantity(1);
      }
    }
  }, [isOpen, product, mode, editedItem]);

  // === 7. Event Handlers ===
  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleSave = () => {
    if (!selectedVariant) return;

    if (mode === "add") {
      if (session?.user) {
        addItem({ productVariantId: selectedVariant.id, quantity });
      } else {
        addGuestItem({ productVariantId: selectedVariant.id, quantity });
        closeModal();
      }
    } else if (mode === "edit" && editedItem) {
      const variantChanged = editedItem.variantId !== selectedVariant.id;

      if (session?.user) {
        if (variantChanged) {
          updateItem({
            oldProductVariantId: editedItem.variantId,
            newProductVariantId: selectedVariant.id,
            newQuantity: quantity,
          });
        } else {
          updateQuantity({
            productVariantId: selectedVariant.id,
            quantity,
          });
        }
      } else {
        // Guest cart logic
        if (variantChanged) {
          // Remove old, add new
          removeGuestItem(editedItem.variantId);
          addGuestItem({ productVariantId: selectedVariant.id, quantity });
        } else {
          updateGuestItem(selectedVariant.id, quantity);
        }
        closeModal();
      }
    }
  };

  // === 8. Render Logic ===
  if (!isOpen || !product) return null;

  const displayImage =
    selectedVariant?.images?.[0] ??
    product?.variants[0]?.images?.[0] ??
    "https://placehold.co/600x600/eee/ccc.png?text=No+Image";

  const displayPrice = selectedVariant
    ? formatCurrency(selectedVariant.price)
    : "N/A";

  const displayStock = selectedVariant?.stock ?? 0;

  const numericRating = parseFloat(product.averageRating);

  return (
    // Modal Overlay
    <div
      className="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
      onClick={closeModal}
    >
      {/* Modal Content */}
      <div
        className="scrollbar-hide flex max-h-[90vh] w-full max-w-[90vw] flex-col gap-5 overflow-y-auto rounded bg-gray-900 p-4 sm:max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3">
          <div className="group relative overflow-hidden rounded">
            <Link href={`/product/${product.id}`}>
              <Image
                src={displayImage}
                alt={product.name ?? "Product image"}
                width={600}
                height={600}
                className="aspect-square h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Edit Button (Top-Left) */}
            {session?.user?.role === "admin" && (
              <Link
                href={`/product/edit/${product.id}`}
                className="absolute top-2 left-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/60 text-gray-100 backdrop-blur-sm transition-colors hover:bg-black/80"
                title="Edit Product"
              >
                <FaPen size={12} />
              </Link>
            )}

            {/* Price Tag (Bottom-Left) */}
            <div className="absolute bottom-2 left-2 z-10 flex gap-2">
              <div className="rounded bg-black/60 px-2 py-1 text-xs font-bold text-gray-300 backdrop-blur-sm">
                {displayPrice}
              </div>
              {/* Stock Tag */}
              <div className="rounded bg-black/60 px-2 py-1 text-xs font-bold text-gray-300 backdrop-blur-sm">
                stock: {displayStock}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-0">
            {/* product name */}
            <Link
              href={`/product/${product.id}`}
              className="line-clamp-2 text-xl font-semibold text-gray-300 hover:text-blue-400"
            >
              {product.name}
            </Link>
            {/* avg rating */}
            <Link
              href={`/product/${product.id}#review-filters`}
              className="flex cursor-pointer items-center gap-1"
            >
              <span className="text-sm text-gray-500">
                {numericRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({formatNumber(product.reviewCount)})
              </span>
              <StarRating rating={numericRating} interactive={false} />
            </Link>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {Object.entries(options).map(([name, values]) => (
            <div key={name} className="flex items-center gap-2">
              <label className="min-w-16 text-sm text-gray-400 capitalize">
                {name}:
              </label>
              <Dropdown
                options={values.map((v) => ({ label: v, value: v }))}
                value={selectedOptions[name] ?? ""}
                onChange={(newValue) => handleOptionChange(name, newValue)}
                buttonColor="bg-gray-800"
                dropdownColor="bg-gray-700"
                dropdownHighlightColor="hover:bg-gray-800"
              />
            </div>
          ))}
          {/* Quantity */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="quantity"
              className="min-w-16 text-sm text-gray-400"
            >
              Quantity:
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              max={displayStock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row gap-3">
          <button
            onClick={closeModal}
            disabled={isPending}
            className="w-full cursor-pointer rounded bg-gray-700/50 px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-600/50 disabled:cursor-default disabled:bg-gray-700/50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || !selectedVariant || displayStock <= 0}
            className="w-full cursor-pointer rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-gray-300 transition-all hover:bg-indigo-500 disabled:cursor-default disabled:bg-indigo-600"
          >
            {isPending
              ? "Saving..."
              : mode === "add"
                ? "Add to Cart"
                : "Save Changes"}
          </button>
          {!selectedVariant && (
            <p className="grow text-sm text-red-500">
              This option is unavailable.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
