// src/app/_components/product/ProductCard.tsx
"use client";

import Link from "next/link";
import { formatCurrency, formatNumber } from "~/server/utils/product";
import type { ProductAndVariants } from "~/type";
import { useSession } from "next-auth/react";
import { FaPen } from "react-icons/fa";
import { FaCartPlus } from "react-icons/fa6";
import { ItemImage } from "../ItemImage";
import {
  circularOverlayClass,
  OverlayLink,
  overlayPositionClasses,
  OverlayTag,
} from "../ItemImageOverlays";
import { AddToCartButton } from "../../button/AddToCartButton";
import StarRating from "../../review/rating/StarRating";

export default function ProductCard({
  product,
}: {
  product: ProductAndVariants;
}) {
  const { data: session } = useSession();

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
      <ItemImage src={image} alt={product.name} href={`/product/${product.id}`}>
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

        {/* Add to Cart Button */}
        <AddToCartButton
          product={product}
          // Combine shared overlay class with positioning
          className={`${circularOverlayClass} ${overlayPositionClasses.topRight}`}
        >
          <FaCartPlus size={14} />
        </AddToCartButton>

        {/* Price Tag */}
        <OverlayTag position="bottomLeft">
          {product.minPrice === product.maxPrice
            ? formatCurrency(variant.price)
            : `From ${formatCurrency(product.minPrice)}`}
        </OverlayTag>
      </ItemImage>

      <div className="flex flex-col gap-0">
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 text-sm font-semibold hover:text-blue-400"
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
  );
}
