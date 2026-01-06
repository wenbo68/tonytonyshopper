/*
  type: uploaded file
  fileName: src/app/_components/modal/ProductVariantModal.tsx
*/
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { useProductVariantModalStore } from "~/app/_hooks/useProductVariantModalStore";
import { formatCurrency, formatNumber } from "~/server/utils/product";
import { useSession } from "next-auth/react";
import { useGuestCartStore } from "~/app/_hooks/useGuestCartStore";
import Link from "next/link";
import { FaPen, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import StarRating from "../comment/rating/StarRating";
import { Dropdown } from "../Dropdown";
import { ItemImage } from "../item/ItemImage";
import {
  OverlayLink,
  OverlayTag,
  OverlayTagGroup,
} from "../item/ItemImageOverlays";
import { handleOverlayClick } from "~/server/utils/modal";
import { customToast } from "~/app/_components/toast";
import { MediaCarousel } from "../MediaCarousel";

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
  // const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  // const scrollContainerRef = useRef<HTMLDivElement>(null);

  // === 3. Query ===
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
      // void utils.cart.get.invalidate();
      customToast.success("Add succeeded.", context?.toastId);
    },
    onError: (err, input, context) => {
      // void utils.cart.get.invalidate();
      customToast.error("Add failed. Please try again.", context?.toastId);
      console.error("ProductVariantModal addMutation onError:", err);
    },
  });

  const updateItemMutation = api.cart.updateItem.useMutation({
    onMutate: async () => {
      const toastId = customToast.loading("Updating...");
      return { toastId };
    },
    onSuccess: async (data, vars, context) => {
      await utils.cart.get.invalidate();
      customToast.success("Update succeeded.", context?.toastId);
    },
    onError: async (err, input, context) => {
      await utils.cart.get.invalidate();
      customToast.error(
        "Update item failed. Please try again.",
        context?.toastId,
      );
    },
  });

  const updateQuantityMutation = api.cart.updateQuantity.useMutation({
    onMutate: async ({ productVariantId, quantity }) => {
      await utils.cart.get.cancel();
      const previousCart = utils.cart.get.getData();

      utils.cart.get.setData(undefined, (old) => {
        if (!old) return [];
        return old.map((item) => {
          if (item.productVariantId === productVariantId) {
            return { ...item, quantity };
          }
          return item;
        });
      });
      return { previousCart };
    },
    onError: (err, input, context) => {
      utils.cart.get.setData(undefined, context?.previousCart);
      customToast.error(
        "Update qty failed. Please try again later.",
        context?.previousCart ? undefined : undefined,
      );
    },
    onSettled: () => {
      void utils.cart.get.invalidate();
    },
  });

  const isPending =
    (addMutation.isPending &&
      product?.variants.some(
        (v) => v.id === addMutation.variables?.productVariantId,
      )) ||
    (updateItemMutation.isPending &&
      product?.variants.some(
        (v) => v.id === updateItemMutation.variables?.newProductVariantId,
      ));

  // === 6. Effects to sync state ===
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

  const selectedVariant = useMemo(() => {
    if (!product?.variants) return null;
    return product.variants.find((variant) => {
      if (!variant.options) return false;
      return Object.entries(selectedOptions).every(
        ([key, value]) => variant.options![key] === value,
      );
    });
  }, [selectedOptions, product?.variants]);

  // === Media Logic ===
  const mediaList = useMemo(() => {
    if (!product) return [];

    // 1. Determine which variant's media to show.
    //    Priority: Selected Variant -> First Variant of Product
    let sourceVariant = selectedVariant;
    if (
      !sourceVariant ||
      !sourceVariant.media ||
      sourceVariant.media.length === 0
    ) {
      sourceVariant = product.variants[0];
    }

    const rawMedia = sourceVariant?.media ?? [];

    // 2. If absolutely no media, return fallback
    if (rawMedia.length === 0) {
      return [
        // {
        //   type: "image",
        //   url: "https://placehold.co/600x600/eee/ccc.png?text=No+Image",
        //   id: "placeholder",
        // },
      ];
    }

    // 3. Sort: Images first, then Videos. Both sorted by position.
    const images = rawMedia
      .filter((m) => m.type === "image")
      .sort((a, b) => a.position - b.position);
    const videos = rawMedia
      .filter((m) => m.type === "video")
      .sort((a, b) => a.position - b.position);

    return [...images, ...videos];
  }, [product, selectedVariant]);

  // // Handle manual scroll (buttons)
  // const scroll = (direction: "left" | "right") => {
  //   if (scrollContainerRef.current) {
  //     const { clientWidth } = scrollContainerRef.current;
  //     scrollContainerRef.current.scrollBy({
  //       left: direction === "left" ? -clientWidth : clientWidth,
  //       behavior: "smooth",
  //     });
  //   }
  // };

  // // Handle scroll event (swiping or button scroll) to update the active index
  // const handleScroll = () => {
  //   if (scrollContainerRef.current) {
  //     const { scrollLeft, clientWidth } = scrollContainerRef.current;
  //     const newIndex = Math.round(scrollLeft / clientWidth);
  //     setActiveMediaIndex(newIndex);
  //   }
  // };

  // useEffect(() => {
  //   if (isOpen) {
  //     document.body.style.overflow = "hidden";
  //     // Reset media index and scroll position when modal opens
  //     setActiveMediaIndex(0);
  //     if (scrollContainerRef.current) {
  //       scrollContainerRef.current.scrollLeft = 0;
  //     }
  //   } else {
  //     document.body.style.overflow = "unset";
  //   }
  //   return () => {
  //     document.body.style.overflow = "unset";
  //   };
  // }, [isOpen]);

  useEffect(() => {
    if (isOpen && product) {
      if (variantAndQuantity) {
        const itemVariant = product.variants.find(
          (v) => v.id === variantAndQuantity.variantId,
        );
        setSelectedOptions(itemVariant?.options ?? {});
        setQuantity(variantAndQuantity.quantity);
      } else if (mode === "add") {
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

  // Logic extracted to be called by form submission
  const executeSave = () => {
    if (!selectedVariant) return;

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
        if (variantChanged) {
          removeGuestItem(variantAndQuantity.variantId);
          addGuestItem({
            productVariantId: selectedVariant.id,
            quantity: finalQuantity,
          });
        } else {
          updateGuestItem(selectedVariant.id, finalQuantity);
        }
      }
    }
  };

  // New Form Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    if (isPending || !selectedVariant || displayStock <= 0) return;
    executeSave();
    closeModal();
  };

  // === 8. Render Logic ===
  if (!isOpen) return null;

  const displayPrice = selectedVariant
    ? formatCurrency(selectedVariant.price)
    : "N/A";

  const displayStock = selectedVariant?.stock ?? 0;
  const numericRating = parseFloat(product?.averageRating ?? "");

  return (
    <div
      className="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
      onMouseDown={(e) => handleOverlayClick(e, closeModal)}
    >
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
              {/* Media Carousel */}
              <MediaCarousel
                mediaList={mediaList}
                // renderItem={(media) =>
                //   media.type === "video" ? (
                //     <video
                //       src={media.url}
                //       controls
                //       className="h-full w-full object-cover"
                //       onClick={(e) => e.stopPropagation()}
                //     />
                //   ) : (
                //     <ItemImage
                //       src={media.url}
                //       alt={product.name ?? "Product image"}
                //       href={`/product/${product.id}`}
                //       onClick={closeModal}
                //       className="h-full w-full"
                //     />
                //   )
                // }
              >
                {/* Overlays */}
                {session?.user?.role === "admin" && (
                  <OverlayLink
                    href={`/product/edit/${product.id}`}
                    position="topRight"
                    title="Edit Product"
                  >
                    <FaPen size={12} />
                  </OverlayLink>
                )}
                <OverlayTagGroup position="topLeft">
                  <OverlayTag className="static">{displayPrice}</OverlayTag>
                  <OverlayTag className="static">
                    Stock: {displayStock}
                  </OverlayTag>
                </OverlayTagGroup>
              </MediaCarousel>

              <div className="flex flex-col items-center gap-0">
                <Link
                  href={`/product/${product.id}`}
                  className="line-clamp-2 text-xl font-semibold text-gray-300 hover:text-blue-400"
                  onClick={closeModal}
                >
                  {product.name}
                </Link>
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

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-3">
                {Object.entries(options).map(([name, values]) => (
                  <div key={name} className="flex items-center gap-2">
                    <label className="min-w-16 text-sm text-gray-400 capitalize">
                      {name}:
                    </label>
                    <Dropdown
                      options={values.map((v) => ({ label: v, value: v }))}
                      value={selectedOptions[name] ?? ""}
                      onChange={(newValue) =>
                        handleOptionChange(name, newValue)
                      }
                      triggerColor="bg-gray-800"
                      menuColor="bg-gray-700"
                      menuHighlightColor="hover:bg-gray-800"
                    />
                  </div>
                ))}

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
                      if (val === "") {
                        setQuantity("");
                      } else {
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
                  type="button" // Important: Explicitly set type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="w-full cursor-pointer rounded bg-gray-700/50 px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-600/50 disabled:cursor-default disabled:bg-gray-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit" // Important: Trigger form submission
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
              </div>
            </form>

            {!selectedVariant && (
              <p className="grow text-sm text-red-500">
                This combination of options is unavailable.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
