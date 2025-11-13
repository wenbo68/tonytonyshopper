// Path: ~/app/product/[productId]/page.tsx
"use client"; // <-- IMPORTANT: Must be a client component

import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { AddToCartButton } from "~/app/_components/cart/AddToCartButton";
import ReviewSection from "~/app/_components/review/ReviewSection";
import { formatCurrency } from "~/server/utils/product";
import { api } from "~/trpc/react"; // <-- IMPORTANT: Use '~/trpc/react'
import { useState, useMemo, useEffect } from "react";

export default function ProductDetailPage(
  {
    //   params,
    // }: {
    //   params: { productId: string };
  },
) {
  // const { productId } = params;
  // ✅ Get productId from the URL
  const params = useParams();
  const productId = params.productId as string;

  // 1. Fetch the product and its variants using the client hook
  const { data: product, isLoading } = api.product.getById.useQuery({
    id: productId,
  });

  // 2. State to hold the user's currently selected options
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
    <section className="flex flex-col gap-0">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Left Column: Image (updates based on selection) */}
        <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded">
          <Image
            src={displayImage}
            alt={product.name ?? "Product image"}
            width={600}
            height={600}
            className="h-full w-full object-cover object-center"
            priority
          />
        </div>
        {/* Right Column: Details */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

          <span className="text-2xl font-semibold">{displayPrice}</span>

          <div className="flex flex-col gap-4">
            {/* --- THIS IS THE NEW DYNAMIC PART --- */}
            {Object.entries(options).map(([name, values]) => (
              <div key={name}>
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {name}:
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {values.map((value) => (
                    <button
                      key={value}
                      onClick={() => handleOptionChange(name, value)}
                      className={`rounded-md border px-4 py-2 text-sm font-medium ${
                        selectedOptions[name] === value
                          ? "border-transparent bg-indigo-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      } `}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {/* --- END OF DYNAMIC PART --- */}
          </div>

          <div className="mt-4">
            {/* Pass the selected variant ID and stock to the button */}
            <AddToCartButton
              productId={product.id}
              initialOptions={selectedOptions}
            />
            {!selectedVariant && product.variants.length > 0 && (
              <p className="mt-2 text-sm text-red-600">
                This combination of options is not available.
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <span className="font-semibold">About this item</span>
            <p className="text-gray-700">{product.description}</p>
          </div>
        </div>
      </div>
      <ReviewSection productId={productId} />
    </section>
  );
}
