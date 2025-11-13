// Path: ~/app/_components/cart/EditCartItemModal.tsx
"use client";

import React, { useState, useEffect } from "react";

// Define the shape of the cart item prop
interface CartItem {
  id: string; // This ID is the productVariantId
  name: string;
  quantity: number;
}

interface EditCartItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
  // --- CHANGED PROPS ---
  onSave: (productVariantId: string, newQuantity: number) => void;
  onRemove: (productVariantId: string) => void;
  // ---
  isUpdating: boolean;
  isRemoving: boolean;
}

export default function EditCartItemModal({
  isOpen,
  onClose,
  item,
  onSave,
  onRemove,
  isUpdating,
  isRemoving,
}: EditCartItemModalProps) {
  // ... (rest of the component is unchanged) ...
  // State to manage the quantity input field
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);

  // Effect to reset the quantity in the modal when a new item is selected
  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
    }
  }, [item]);

  if (!isOpen || !item) {
    return null;
  }

  const handleSave = () => {
    // item.id is the productVariantId passed from cart/page.tsx
    onSave(item.id, quantity);
  };

  const handleRemove = () => {
    // item.id is the productVariantId
    onRemove(item.id);
  };

  return (
    // ... (rest of the JSX is unchanged) ...
    <div
      className="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[90vw] flex-col gap-5 rounded bg-gray-900 p-5 sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <span className="text-lg font-bold text-gray-300">{item.name}</span>
          <span className="text-sm text-gray-400">Edit item</span>
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="quantity"
            className="min-w-16 text-sm font-semibold text-gray-400"
          >
            Quantity:
          </label>
          <input
            type="number"
            id="quantity"
            min="0" // Allow 0 to remove item via save
            value={quantity}
            onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
            className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            autoFocus
          />
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            onClick={handleSave}
            disabled={isUpdating || isRemoving}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-800 sm:w-auto"
          >
            {isUpdating ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            disabled={isUpdating || isRemoving}
            className="w-full rounded-md bg-gray-700 px-4 py-2 font-semibold text-gray-300 transition-colors hover:bg-gray-600 disabled:cursor-not-allowed sm:w-auto"
          >
            Cancel
          </button>
          <div className="grow" />
          <button
            onClick={handleRemove}
            disabled={isUpdating || isRemoving}
            className="w-full rounded-md bg-red-800 px-4 py-2 font-semibold text-gray-300 transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-900 sm:w-auto"
          >
            {isRemoving ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
