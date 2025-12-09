"use client";

import Link from "next/link";
import Image from "next/image";
import { formatCurrency, formatNumber } from "~/server/utils/product";
import { AddToCartButton } from "../cart/AddToCartButton";
import StarRating from "../rating/StarRating";
import type { ProductAndVariants } from "~/type";
import { useSession } from "next-auth/react";
import { FaPen } from "react-icons/fa";
import { FaCartPlus } from "react-icons/fa6";

export default function ProductCard({
  product,
}: {
  product: ProductAndVariants;
}) {
  const { data: session } = useSession();

  // get the variant with the lowest price
  const variant = product.variants.reduce((prev, curr) =>
    parseFloat(curr.price) < parseFloat(prev.price) ? curr : prev,
  );

  const image =
    variant?.images?.[0] ??
    product.variants[0]?.images?.[0] ??
    "https://placehold.co/600x600/eee/ccc.png?text=No+Image";

  const numericRating = parseFloat(product.averageRating);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded">
        <Link href={`/product/${product.id}`}>
          <Image
            src={image}
            alt={product.name ?? "Product image"}
            width={600}
            height={600}
            className="aspect-square h-full w-full object-cover transition-transform duration-300 hover:scale-105"
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

        {/* Add to Cart Button (Top-Right) */}
        <AddToCartButton
          // productId={product.id}
          product={product} // <-- Pass the full product object here
          className="absolute top-2 right-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/60 text-gray-100 backdrop-blur-sm transition-colors hover:bg-black/80"
        >
          <FaCartPlus size={14} />
        </AddToCartButton>

        {/* Price Tag (Bottom-Left) */}
        <div className="absolute bottom-2 left-2 z-10 rounded bg-black/60 px-2 py-1 text-xs font-bold text-gray-100 backdrop-blur-sm">
          {product.minPrice === product.maxPrice
            ? formatCurrency(variant.price)
            : `From ${formatCurrency(product.minPrice)}`}
        </div>
      </div>

      <div className="flex flex-col gap-0">
        {/* product name */}
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 text-sm font-semibold hover:text-blue-400"
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
  );
}
