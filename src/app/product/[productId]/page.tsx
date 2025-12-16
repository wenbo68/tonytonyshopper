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

export default function ProductDetailPage() {
  // ==== hooks ====
  const { data: session } = useSession();
  const utils = api.useUtils();
  const queryClient = useQueryClient();
  // const params = useParams();
  // const productId = params.productId as string;
  const { productId } = useProductContext();

  // ==== states ====
  const [activeImage, setActiveImage] = useState<string>("");
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

  // ==== effect & memo: images ====

  // Calculate the list of images to display
  const activeImageList = useMemo(() => {
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    // Fallback: If no variant selected or variant has no images, use first variant's images
    if (product?.variants[0]?.images && product.variants[0].images.length > 0) {
      return product.variants[0].images;
    }
    // Fallback: Placeholder
    return ["https://placehold.co/600x600/eee/ccc.png?text=No+Image"];
  }, [selectedVariant, product]);

  // Sync activeImage when the available list changes (e.g., variant switch)
  useEffect(() => {
    if (activeImageList.length > 0) {
      setActiveImage(activeImageList[0] ?? "");
    }
  }, [activeImageList]);

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
      {/* Left: Image Gallery */}
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        {/* Main Image */}
        <div className="relative aspect-square w-full grow overflow-hidden rounded border border-gray-800 bg-gray-900">
          <Image
            src={activeImage}
            alt={product.name ?? "Product image"}
            fill
            className="object-cover"
            priority
          />
          {/* Price Tag (Bottom-Left) */}
          <div className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-2">
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
        <div className="scrollbar-hide flex gap-3 overflow-x-auto sm:h-[560px] sm:min-w-28 sm:flex-col sm:overflow-y-auto">
          {activeImageList.map((img, index) => (
            <button
              key={`${img}-${index}`}
              onClick={() => setActiveImage(img)}
              className={clsx(
                "relative aspect-square w-20 shrink-0 overflow-hidden rounded border-2 transition-all sm:w-full",
                activeImage === img
                  ? "border-blue-500 opacity-100 ring-2 ring-blue-500/20"
                  : "border-transparent bg-gray-800 opacity-60 hover:opacity-100",
              )}
            >
              <Image
                src={img}
                alt={`Product view ${index + 1}`}
                fill
                className="object-cover"
              />
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
                buttonColor="bg-gray-900"
                dropdownColor="bg-gray-800"
                dropdownHighlightColor="hover:bg-gray-900"
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
