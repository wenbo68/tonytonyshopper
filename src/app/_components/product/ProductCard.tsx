// Path: ~/app/_components/product/ProductCard.tsx
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "~/server/utils/product";
import { AddToCartButton } from "../cart/AddToCartButton";
import StarRating from "../rating/StarRating";
import type { ProductAndVariants } from "~/type";

export default function ProductCard({
  product,
}: {
  product: ProductAndVariants;
}) {
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
    <div className="flex flex-col">
      <Link href={`/product/${product.id}`} className="flex flex-col gap-2">
        <Image
          src={image}
          alt={product.name ?? "Product image"}
          width={600}
          height={600}
          className="h-full w-full rounded"
        />
        <div className="flex flex-col gap-0">
          <span className="line-clamp-2">{product.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {numericRating.toFixed(1)}
            </span>
            <StarRating rating={numericRating} interactive={false} />
            <span className="text-sm text-gray-500">
              ({product.reviewCount})
            </span>
          </div>
          {/* Display 'From' if there are multiple price points */}
          <span className="">
            {product.variants.length > 1 ? "From " : ""}
            {formatCurrency(variant.price)}
          </span>
        </div>
      </Link>
      <AddToCartButton productId={product.id} />
    </div>
  );
}
