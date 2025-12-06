"use client";

import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { AddToCartButton } from "~/app/_components/cart/AddToCartButton";
import ReviewSection from "~/app/_components/review/ReviewSection";
import { formatCurrency } from "~/server/utils/product";
import { api } from "~/trpc/react";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dropdown } from "~/app/_components/Dropdown";

export default function ProductDetailPage(
  {
    //   params,
    // }: {
    //   params: { productId: string };
  },
) {
  // const { productId } = params;
  const queryClient = useQueryClient();

  // ✅ Get productId from the URL
  const params = useParams();
  const productId = params.productId as string;

  // 1. Fetch the product and its variants using the client hook
  const { data: product, isLoading } = api.product.getById.useQuery(
    {
      id: productId,
    },
    {
      // --- NEW OPTIMIZATION ---
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

  // 2. State to hold the user's currently selected options
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  // 3. Derive all unique options from the variants (e.g., { color: ["Red", "Blue"], logo: ["A", "B"] })
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

  // 4. Set the *initial* selected options once the product loads
  // We'll default to the first variant's options
  useEffect(() => {
    if (product && product.variants.length > 0) {
      setSelectedOptions(product.variants[0]?.options ?? {});
    }
  }, [product]);

  // 5. Find the variant that matches the currently selected options
  // This runs every time the user clicks a new option
  const selectedVariant = useMemo(() => {
    if (!product?.variants) return null;
    return product.variants.find((variant) => {
      return Object.entries(selectedOptions).every(
        ([key, value]) => variant.options?.[key] === value,
      );
    });
  }, [selectedOptions, product?.variants]);

  // --- Loading and Not Found States ---
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

  // --- Determine what to display ---
  // Use the selected variant's image, or the product's first variant's image as a fallback
  const displayImage =
    selectedVariant?.images?.[0] ?? // 1. Selected variant's image
    product.variants[0]?.images?.[0] ?? // 2. First variant's image (default)
    "https://placehold.co/600x600/eee/ccc.png?text=No+Image"; // 3. Placeholder

  const displayPrice = selectedVariant
    ? formatCurrency(selectedVariant.price)
    : "N/A";

  const displayStock = selectedVariant?.stock ?? 0;
  const isAvailable = selectedVariant && displayStock > 0;

  // --- Handler for clicking an option button ---
  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-5">
      {/* <div className="flex flex-col gap-5"> */}
      {/* images */}
      <div className="relative">
        <Image
          src={displayImage}
          alt={product.name ?? "Product image"}
          width={600}
          height={600}
          className="aspect-square h-full w-full overflow-hidden rounded object-cover"
          priority
        />
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
                className="w-full"
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

        <div className="">
          <AddToCartButton product={product} initialOptions={selectedOptions} />
          {!selectedVariant && product.variants.length > 0 && (
            <p className="text-sm text-red-600">
              This combination of options is not available.
            </p>
          )}
        </div>
      </div>
      {/* </div> */}
      <ReviewSection productId={productId} />
    </section>
  );
}
