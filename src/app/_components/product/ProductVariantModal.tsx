"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { api, type RouterOutputs } from "~/trpc/react";
import { useVariantModalStore } from "~/app/_hooks/useVariantModal";
import { formatCurrency } from "~/server/utils/product";
import { useSession } from "next-auth/react";
import { useGuestCartStore } from "~/app/_hooks/useGuestCart";

// Get tRPC types
type Product = RouterOutputs["product"]["getById"];
type Variant = NonNullable<Product>["variants"][0];

export function ProductVariantModal() {
  const { data: session } = useSession();
  const utils = api.useUtils();

  // === 1. Global Modal State ===
  const { isOpen, mode, productId, editingItem, closeModal, initialOptions } =
    useVariantModalStore();

  // === 2. Internal Component State ===
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);

  // === 3. Data Fetching ===
  // Fetch the full product details
  const { data: product, isLoading: isLoadingProduct } =
    api.product.getById.useQuery(
      { id: productId! },
      {
        enabled: !!productId, // Only run query if productId is set
      },
    );

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
      onSuccess: () => {
        utils.cart.get.invalidate();
        closeModal();
      },
    });

  const { mutate: updateQuantity, isPending: isUpdatingQty } =
    api.cart.updateQuantity.useMutation({
      onSuccess: () => {
        utils.cart.get.invalidate();
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
  // === 6. UPDATE THIS useEffect ===
  useEffect(() => {
    if (isOpen && product) {
      if (mode === "edit" && editingItem) {
        // Pre-fill with item's data
        const itemVariant = product.variants.find(
          (v) => v.id === editingItem.id,
        );
        setSelectedOptions(itemVariant?.options ?? {});
        setQuantity(editingItem.quantity);
      } else if (mode === "add" && initialOptions) {
        // --- THIS IS THE FIX ---
        // Use the pre-selected options from the store
        setSelectedOptions(initialOptions);
        setQuantity(1);
      } else {
        // Fallback for "add" mode (e.g., from product card)
        setSelectedOptions(product.variants[0]?.options ?? {});
        setQuantity(1);
      }
    }
    // --- ADD initialOptions to dependency array ---
  }, [isOpen, product, mode, editingItem, initialOptions]);

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
    } else if (mode === "edit" && editingItem) {
      const variantChanged = editingItem.id !== selectedVariant.id;

      if (session?.user) {
        if (variantChanged) {
          updateItem({
            oldProductVariantId: editingItem.id,
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
          removeGuestItem(editingItem.id);
          addGuestItem({ productVariantId: selectedVariant.id, quantity });
        } else {
          updateGuestItem(selectedVariant.id, quantity);
        }
        closeModal();
      }
    }
  };

  // === 8. Render Logic ===
  if (!isOpen) return null;

  const displayImage =
    selectedVariant?.images?.[0] ??
    product?.variants[0]?.images?.[0] ??
    "https://placehold.co/600x600/eee/ccc.png?text=No+Image";

  const displayPrice = selectedVariant
    ? formatCurrency(selectedVariant.price)
    : "N/A";

  const displayStock = selectedVariant?.stock ?? 0;

  return (
    // Modal Overlay
    <div
      className="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
      onClick={closeModal}
    >
      {/* Modal Content */}
      <div
        className="flex w-full max-w-[90vw] flex-col gap-5 rounded bg-gray-900 p-5 sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoadingProduct || !product ? (
          <div className="text-center text-gray-300">Loading...</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-gray-700">
                <Image
                  src={displayImage}
                  alt={product.name ?? "Product"}
                  width={100}
                  height={100}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-gray-300">
                  {product.name}
                </h2>
                <span className="text-xl font-semibold text-gray-200">
                  {displayPrice}
                </span>
                <span className="text-sm text-gray-400">
                  {displayStock > 0
                    ? `${displayStock} in stock`
                    : "Out of stock"}
                </span>
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-4">
              {Object.entries(options).map(([name, values]) => (
                <div key={name}>
                  <label className="text-sm font-medium text-gray-400 capitalize">
                    {name}:
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {values.map((value) => (
                      <button
                        key={value}
                        onClick={() => handleOptionChange(name, value)}
                        className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                          selectedOptions[name] === value
                            ? "border-transparent bg-indigo-600 text-white"
                            : "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                        } `}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="quantity"
                className="min-w-16 text-sm font-semibold text-gray-400"
              >
                Quantity:
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                max={displayStock}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(0, Number(e.target.value)))
                }
                className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                onClick={handleSave}
                disabled={isPending || !selectedVariant || displayStock <= 0}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-800 sm:w-auto"
              >
                {isPending
                  ? "Saving..."
                  : mode === "add"
                    ? "Add to Cart"
                    : "Save Changes"}
              </button>
              <button
                onClick={closeModal}
                disabled={isPending}
                className="w-full rounded-md bg-gray-700 px-4 py-2 font-semibold text-gray-300 transition-colors hover:bg-gray-600 disabled:cursor-not-allowed sm:w-auto"
              >
                Cancel
              </button>
              {!selectedVariant && (
                <p className="grow text-sm text-red-500">
                  This option is unavailable.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
