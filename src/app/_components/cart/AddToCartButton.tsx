"use client";

import { useProductVariantModalStore } from "~/app/_hooks/useVariantModalStore";
import type { ReactNode } from "react";
import type { ProductAndVariants } from "~/type";

export function AddToCartButton({
  product,
  initialOptions,
  className,
  children,
}: {
  product: ProductAndVariants;
  initialOptions?: Record<string, string>;
  className?: string;
  children?: ReactNode;
}) {
  const openModal = useProductVariantModalStore((state) => state.openModal);

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openModal(product, "add", undefined, initialOptions);
  };

  return (
    <button
      onClick={handleOpenModal}
      className={
        className ??
        "w-full cursor-pointer rounded bg-indigo-600 px-4 py-2 font-semibold text-gray-300 transition-all hover:bg-indigo-500 disabled:cursor-default disabled:bg-indigo-600"
      }
    >
      {children ?? "Add to Cart"}
    </button>
  );
}
