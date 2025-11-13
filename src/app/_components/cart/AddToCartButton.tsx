"use client";

import { useVariantModalStore } from "~/app/_hooks/useVariantModal";

// --- UPDATE THE PROPS ---
export function AddToCartButton({
  productId,
  initialOptions,
}: {
  productId: string;
  initialOptions?: Record<string, string> | null;
}) {
  const openModal = useVariantModalStore((state) => state.openModal);

  const handleOpenModal = () => {
    // --- UPDATE THE FUNCTION CALL ---
    // Pass 'undefined' for the editingItem, then pass the initialOptions
    openModal(productId, "add", undefined, initialOptions);
  };

  return (
    <button
      onClick={handleOpenModal}
      className="flex w-full items-center justify-center rounded bg-indigo-600 px-8 py-3 text-gray-300 hover:bg-indigo-700 disabled:opacity-50"
    >
      Add to Cart
    </button>
  );
}
