"use client";

import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { formatCurrency } from "~/server/utils/product";
import { api } from "~/trpc/react";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dropdown } from "~/app/_components/Dropdown";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { useGuestCartStore } from "~/app/_hooks/useGuestCartStore";
import { useProductContext } from "~/app/_contexts/ProductProvider";

// Helper type for media items
type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  position: number;
  key: string;
};

export default function ProductDetailPage() {
  // ==== hooks ====
  const { data: session } = useSession();
  const utils = api.useUtils();
  const queryClient = useQueryClient();
  // const params = useParams();
  // const productId = params.productId as string;
  const { productId } = useProductContext();

  // ==== states ====
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  // ==== mutations ====
  // to add item to guest/user cart
  const addItemToGuestCart = useGuestCartStore((state) => state.addItem);
  const { mutate: addItemToUserCart, isPending: isAddingToUserCart } =
    api.cart.add.useMutation({
      onSuccess: () => {
        utils.cart.get.invalidate();
      },
    });

  // ==== queries ====
  // Find product from product/all client cache -> if not found, fetch from db
  const { data: product, isLoading } = api.product.getById.useQuery(
    {
      id: productId,
    },
    {
      // Check if this product already exists in the 'product.search' cache (from 'All Products' page)
      initialData: () => {
        // tRPC query keys are arrays where the first element is the path array
        // We look for any queries starting with ['product', 'search']
        const allSearchQueries = queryClient.getQueriesData({
          queryKey: [["product", "search"]],
        });

        for (const [, queryData] of allSearchQueries) {
          // Cast queryData to expected shape (it has a 'products' array)
          const data = queryData as {
            products: Array<{ id: string; [key: string]: any }>;
          };

          const foundProduct = data?.products?.find((p) => p.id === productId);

          if (foundProduct) {
            // Found it! Return it as the initial data.
            console.log("found");
            return foundProduct as any;
          }
        }
        console.log("not found");
        return undefined;
      },
      // If we found initial data, consider it fresh for 5 mins so we don't immediately background refetch
      staleTime: 1000 * 60 * 10,
    },
  );

  // ==== effect & memo: options ====

  // Using all variants, derive the product options (e.g., { color: ["Red", "Blue"], logo: ["A", "B"] })
  // This runs only when the product data loads
  const options = useMemo(() => {
    if (!product || !product.variants) return {};
    const opts: Record<string, Set<string>> = {};
    for (const variant of product.variants) {
      if (variant.options) {
        Object.entries(variant.options).forEach(([key, value]) => {
          if (!opts[key]) {
            opts[key] = new Set();
          }
          opts[key].add(value);
        });
      }
    }
    // Convert Sets to Arrays
    return Object.fromEntries(
      Object.entries(opts).map(([key, valueSet]) => [
        key,
        Array.from(valueSet),
      ]),
    );
  }, [product]);

  // initialize selectedOptions to be the 1st variant
  // This runs only when the product data loads
  useEffect(() => {
    if (product && product.variants.length > 0) {
      setSelectedOptions(product.variants[0]?.options ?? {});
    }
  }, [product]);

  // Find the variant that matches the currently selected options
  // This runs every time the user clicks a new option
  const selectedVariant = useMemo(() => {
    if (!product?.variants) return null;
    return product.variants.find((variant) => {
      return Object.entries(selectedOptions).every(
        ([key, value]) => variant.options?.[key] === value,
      );
    });
  }, [selectedOptions, product?.variants]);

  // ==== effect & memo: media ====

  // Calculate the list of media (images/videos) to display
  const activeMediaList = useMemo(() => {
    let rawList: MediaItem[] = [];

    // 1. Try selected variant's media
    if (selectedVariant?.media && selectedVariant.media.length > 0) {
      rawList = selectedVariant.media;
    }
    // 2. Fallback: First variant's media
    else if (
      product?.variants[0]?.media &&
      product.variants[0].media.length > 0
    ) {
      rawList = product.variants[0].media;
    }
    // 3. Fallback: Placeholder
    else {
      return [
        {
          id: "placeholder",
          type: "image",
          url: "https://placehold.co/600x600/eee/ccc.png?text=No+Image",
          position: 0,
          key: "placeholder",
        },
      ] as MediaItem[];
    }

    // Sort: Images first, then Videos. Secondary sort by position.
    return [...rawList].sort((a, b) => {
      // Priority 1: Type (Image < Video)
      if (a.type !== b.type) {
        return a.type === "image" ? -1 : 1;
      }
      // Priority 2: Position
      return a.position - b.position;
    });
  }, [selectedVariant, product]);

  // Sync activeMedia when the available list changes
  useEffect(() => {
    if (activeMediaList.length > 0) {
      setActiveMedia(activeMediaList[0]!);
    }
  }, [activeMediaList]);

  // Determine what to show in the main view
  const currentMedia = activeMedia ?? activeMediaList[0];

  // ==== Conditional Rendering ====
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 text-center">
        Loading product...
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  // ==== constants ====
  const displayPrice = selectedVariant
    ? formatCurrency(selectedVariant.price)
    : "N/A";
  const displayStock = selectedVariant?.stock ?? 0;
  const isOptionAvailable = !selectedVariant && product.variants.length > 0;

  // ==== Handlers ====
  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    if (session?.user) {
      addItemToUserCart({ productVariantId: selectedVariant.id, quantity });
    } else {
      addItemToGuestCart({ productVariantId: selectedVariant.id, quantity });
    }
  };

  return (
    <>
      {/* images */}
      {/* Left: Image/Video Gallery */}
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        {/* Main Media View */}
        <div className="relative aspect-square w-full grow overflow-hidden rounded bg-gray-900">
          {currentMedia?.type === "video" ? (
            <video
              src={currentMedia.url}
              controls
              className="h-full w-full object-contain"
              // Optional: You could add a poster image here if you have one
            />
          ) : (
            <Image
              src={
                currentMedia?.url ??
                "https://placehold.co/600x600/e0e0e0/333.png?text=No-Image"
              }
              alt={product.name ?? "Product image"}
              fill
              className="object-contain"
              priority
            />
          )}

          {/* Price Tag (Bottom-Left) */}
          <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-2">
            <div className="rounded bg-black/70 px-3 py-2 text-xs font-bold text-gray-300 backdrop-blur-md">
              {displayPrice}
            </div>
            {/* Stock Tag */}
            <div className="rounded bg-black/70 px-3 py-2 text-xs font-bold text-gray-300 backdrop-blur-md">
              Stock: {displayStock}
            </div>
          </div>
        </div>

        {/* Thumbnails (Vertical on desktop, horizontal on mobile) */}
        <div className="scrollbar-hide flex gap-3 overflow-x-auto sm:h-[560px] sm:max-w-28 sm:flex-col sm:overflow-y-auto">
          {activeMediaList.map((media, index) => (
            <button
              key={`${media.id}-${index}`}
              onClick={() => setActiveMedia(media)}
              className={clsx(
                "relative aspect-square w-20 shrink-0 overflow-hidden rounded border-2 transition-all sm:w-full",
                activeMedia?.id === media.id
                  ? "border-blue-500 opacity-100"
                  : "border-transparent bg-gray-800 opacity-60 hover:opacity-100",
              )}
            >
              {media.type === "video" ? (
                <div className="relative h-full w-full">
                  <video
                    src={media.url}
                    className="h-full w-full object-contain"
                  />
                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-8 w-8 text-white drop-shadow-md"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              ) : (
                <Image
                  src={media.url}
                  alt={`Product view ${index + 1}`}
                  fill
                  className="object-contain"
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-0">
          {/* product name */}
          <h1 className="text-xl font-semibold text-gray-300">
            {product.name}
          </h1>
          {/* description */}
          <p className="text-sm text-gray-400">{product.description}</p>
        </div>

        <div className="flex flex-col gap-3">
          {/* options */}
          {Object.entries(options).map(([name, values]) => (
            <div key={name} className="flex items-center gap-2">
              <label className="min-w-16 text-sm text-gray-400 capitalize">
                {name}:
              </label>
              <Dropdown
                options={values.map((v) => ({ label: v, value: v }))}
                value={selectedOptions[name] ?? ""}
                onChange={(newValue) => handleOptionChange(name, newValue)}
                triggerColor="bg-gray-900"
                menuColor="bg-gray-800"
                // menuRingColor="bg-gray-700"
                menuHighlightColor="hover:bg-gray-900"
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
              className="w-full rounded bg-gray-900 px-3 py-2 text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-0">
          {!selectedVariant && product.variants.length > 0 && (
            <p className="text-sm text-red-600">
              This combination of options is not available.
            </p>
          )}
          {/* <AddToCartButton product={product} initialOptions={selectedOptions} /> */}
          <button
            onClick={handleAddToCart}
            disabled={
              isAddingToUserCart || !isOptionAvailable || displayStock <= 0
            }
            className="w-full cursor-pointer rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-gray-300 transition-all hover:bg-indigo-500 disabled:cursor-default disabled:bg-indigo-600"
          >
            {!isOptionAvailable
              ? `Unavailable Options`
              : displayStock <= 0
                ? `Out of Stock`
                : isAddingToUserCart
                  ? `Adding...`
                  : `Add To Cart`}
          </button>
        </div>
      </div>
    </>
  );
}
