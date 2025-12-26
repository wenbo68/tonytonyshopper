"use client";

import { useState, useMemo, useEffect } from "react";
import { api } from "~/trpc/react";
import { useProductVariantModalStore } from "~/app/_hooks/useProductVariantModalStore";
import { formatCurrency, formatNumber } from "~/server/utils/product";
import { useSession } from "next-auth/react";
import { useGuestCartStore } from "~/app/_hooks/useGuestCartStore";
import Link from "next/link";
import { FaPen } from "react-icons/fa";
import StarRating from "../review/rating/StarRating";
import { Dropdown } from "../Dropdown";
import { ItemImage } from "../item/ItemImage";
import {
  OverlayLink,
  OverlayTag,
  OverlayTagGroup,
} from "../item/ItemImageOverlays";
import { handleOverlayClick } from "~/server/utils/modal";
import { customToast } from "~/app/_components/toast";

export function ProductVariantModal() {
  const { data: session } = useSession();
  const utils = api.useUtils();

  // === 1. Global Modal State ===
  const {
    isOpen,
    closeModal,
    mode,
    variantAndQuantity,
    product: productProps,
    productId,
  } = useProductVariantModalStore();

  // === 2. Internal Component State ===
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState<number | "">(1);

  // === 3. Query ===
  // Fetch product if we only have an ID
  const { data: fetchedProduct, isFetching: isFetchingProduct } =
    api.product.getById.useQuery(
      { id: productId ?? "" },
      { enabled: !!productId && isOpen },
    );
  const product = productProps ?? fetchedProduct;

  // === 4. Guest Cart Mutations ===
  const addGuestItem = useGuestCartStore((state) => state.addItem);
  const updateGuestItem = useGuestCartStore((state) => state.updateQuantity);
  const removeGuestItem = useGuestCartStore((state) => state.removeItem);

  // === 5. Logged-in (tRPC) Mutations ===
  const addMutation = api.cart.add.useMutation({
    onMutate: () => {
      const toastId = customToast.loading("Adding...");
      return { toastId };
    },
    onSuccess: (data, vars, context) => {
      void utils.cart.get.invalidate();
      customToast.success("Add succeeded.", context?.toastId);
    },
    onError: (err, input, context) => {
      void utils.cart.get.invalidate();
      customToast.error("Add failed. Please try again.", context?.toastId);
      console.error("ProductVariantModal addMutation onError:", err);
    },
  });

  const updateItemMutation = api.cart.updateItem.useMutation({
    onMutate: () => {
      const toastId = customToast.loading("Updating...");
      return { toastId };
    },
    onSuccess: (data, vars, context) => {
      void utils.cart.get.invalidate();
      customToast.success("Update succeeded.", context?.toastId);
    },
    onError: (err, input, context) => {
      void utils.cart.get.invalidate();
      customToast.error("Update failed. Please try again.", context?.toastId);
      console.error("ProductVariantModal updateItemMutation onError:", err);
    },
  });

  const updateQuantityMutation = api.cart.updateQuantity.useMutation({
    onMutate: () => {
      const toastId = customToast.loading("Updating...");
      return { toastId };
    },
    onSuccess: (data, vars, context) => {
      void utils.cart.get.invalidate();
      customToast.success("Update succeeded.", context?.toastId);
    },
    onError: (err, input, context) => {
      void utils.cart.get.invalidate();
      customToast.error("Update failed. Please try again.", context?.toastId);
      console.error("ProductVariantModal updateQuantityMutation onError:", err);
    },
  });

  // Determine pending state based on the active product
  const isPending =
    (addMutation.isPending &&
      product?.variants.some(
        (v) => v.id === addMutation.variables?.productVariantId,
      )) ||
    (updateItemMutation.isPending &&
      product?.variants.some(
        (v) => v.id === updateItemMutation.variables?.newProductVariantId,
      )) ||
    (updateQuantityMutation.isPending &&
      product?.variants.some(
        (v) => v.id === updateQuantityMutation.variables?.productVariantId,
      ));

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

  // prevent scrolling main page when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // This effect pre-fills the state when the modal opens
  useEffect(() => {
    if (isOpen && product) {
      // Updated: Check for editedItem in both 'edit' and 'add' modes to allow pre-selection
      if (variantAndQuantity) {
        const itemVariant = product.variants.find(
          (v) => v.id === variantAndQuantity.variantId,
        );
        setSelectedOptions(itemVariant?.options ?? {});
        setQuantity(variantAndQuantity.quantity);
      } else if (mode === "add") {
        // Fallback for generic "add" clicks (e.g., from product list)
        setSelectedOptions(product.variants[0]?.options ?? {});
        setQuantity(1);
      }
    }
  }, [isOpen, product, mode, variantAndQuantity]);

  // === 7. Event Handlers ===
  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleSave = () => {
    if (!selectedVariant) return;

    // Convert to number here, defaulting to 0 if empty/invalid
    const finalQuantity = quantity === "" ? 0 : quantity;
    setQuantity(finalQuantity);

    if (mode === "add") {
      if (session?.user) {
        addMutation.mutate({
          productVariantId: selectedVariant.id,
          quantity: finalQuantity,
        });
      } else {
        addGuestItem({
          productVariantId: selectedVariant.id,
          quantity: finalQuantity,
        });
        // closeModal();
      }
    } else if (mode === "edit" && variantAndQuantity) {
      const variantChanged =
        variantAndQuantity.variantId !== selectedVariant.id;

      if (session?.user) {
        if (variantChanged) {
          updateItemMutation.mutate({
            oldProductVariantId: variantAndQuantity.variantId,
            newProductVariantId: selectedVariant.id,
            newQuantity: finalQuantity,
          });
        } else {
          updateQuantityMutation.mutate({
            productVariantId: selectedVariant.id,
            quantity: finalQuantity,
          });
        }
      } else {
        // Guest cart logic
        if (variantChanged) {
          // Remove old, add new
          removeGuestItem(variantAndQuantity.variantId);
          addGuestItem({
            productVariantId: selectedVariant.id,
            quantity: finalQuantity,
          });
        } else {
          updateGuestItem(selectedVariant.id, finalQuantity);
        }
        // closeModal();
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

  const numericRating = parseFloat(product?.averageRating ?? "");

  return (
    // Modal Overlay
    <div
      className="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
      onMouseDown={(e) => handleOverlayClick(e, closeModal)}
    >
      {/* Modal Content */}
      <div
        className="max-h-[90vh] w-full max-w-[90vw] sm:max-w-sm"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {isFetchingProduct ? (
          <div className="rounded bg-gray-900 p-6 text-center text-gray-500">
            <p className="animate-pulse">Loading product...</p>
          </div>
        ) : !product ? (
          <div className="rounded bg-gray-900 p-6 text-center">
            <p className="">Product not found.</p>
          </div>
        ) : (
          <div className="scrollbar-hide flex w-full flex-col gap-5 overflow-y-auto rounded bg-gray-900 p-4">
            <div className="flex flex-col gap-3">
              <ItemImage
                src={displayImage}
                alt={product.name ?? "Product image"}
                href={`/product/${product.id}`}
                onClick={closeModal}
                className="group" // to keep hover scale effect on image
              >
                {/* Edit Button */}
                {session?.user?.role === "admin" && (
                  <OverlayLink
                    href={`/product/edit/${product.id}`}
                    position="topLeft"
                    title="Edit Product"
                  >
                    <FaPen size={12} />
                  </OverlayLink>
                )}

                {/* Tags Group */}
                <OverlayTagGroup position="bottomLeft">
                  <OverlayTag
                    position="bottomLeft"
                    className="static" // Override absolute to allow flex flow
                  >
                    {displayPrice}
                  </OverlayTag>
                  <OverlayTag
                    position="bottomLeft"
                    className="static" // Override absolute
                  >
                    Stock: {displayStock}
                  </OverlayTag>
                </OverlayTagGroup>
              </ItemImage>

              <div className="flex flex-col items-center gap-0">
                {/* product name */}
                <Link
                  href={`/product/${product.id}`}
                  className="line-clamp-2 text-xl font-semibold text-gray-300 hover:text-blue-400"
                  onClick={closeModal}
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
                  min="0"
                  max={displayStock}
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    // If empty string, allow it so user can type a new number
                    if (val === "") {
                      setQuantity("");
                    } else {
                      // Otherwise, parse as number and ensure it's not negative
                      setQuantity(Math.max(0, Number(val)));
                    }
                  }}
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
                {mode === "add"
                  ? isPending
                    ? "Adding..."
                    : "Add to Cart"
                  : isPending
                    ? "Saving..."
                    : "Save"}
              </button>
              {!selectedVariant && (
                <p className="grow text-sm text-red-500">
                  This option is unavailable.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
