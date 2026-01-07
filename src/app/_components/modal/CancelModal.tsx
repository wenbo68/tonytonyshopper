"use client";

import { api } from "~/trpc/react";
import { customToast } from "../toast";
import { useEffect, useState } from "react";
import { handleOverlayClick } from "~/server/utils/modal";

export default function CancelModal({
  isOpen,
  onClose,
  cancelModalProps,
}: {
  isOpen: boolean;
  onClose: () => void;
  cancelModalProps: { orderItemId: string; maxQuantity: number } | null;
}) {
  const utils = api.useUtils();

  const [quantity, setQuantity] = useState<number | "">(1);

  // prevent scrolling main page when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const invalidateQueries = async () => {
    await utils.order.getUserOrders.invalidate();
  };

  const cancelItemMutation = api.orderItem.cancelOrderItem.useMutation({
    onMutate: () => {
      const toastId = customToast.loading("Canceling...");
      return { toastId };
    },
    onSuccess: (data, vars, context) => {
      void invalidateQueries();
      customToast.success("Cancel succeeded.", context?.toastId);
    },
    onError: (error, vars, context) => {
      void invalidateQueries();
      customToast.error(`Cancel failed. ${error.message}`, context?.toastId);
    },
  });

  if (!isOpen || !cancelModalProps) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalQuantity = quantity === "" ? 0 : quantity;
    setQuantity(finalQuantity);

    cancelItemMutation.mutate({
      orderItemId: cancelModalProps.orderItemId,
      quantity: finalQuantity,
    });
  };

  const cancelItemMutationIsPending =
    cancelItemMutation.isPending &&
    cancelItemMutation.variables?.orderItemId === cancelModalProps.orderItemId;
  const isPending = cancelItemMutationIsPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
      onMouseDown={(e) => handleOverlayClick(e, onClose)}
    >
      <form
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex max-h-[80vh] w-sm max-w-[90vw] flex-col gap-4 rounded bg-gray-900 p-4"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 text-sm">
            <label className="font-semibold">Quantity</label>
            <input
              type="number"
              id="quantity"
              min="1"
              max={cancelModalProps.maxQuantity}
              value={quantity}
              onChange={(e) => {
                const val = e.target.value;
                // If empty string, allow it so user can type a new number
                if (val === "") {
                  setQuantity("");
                } else {
                  // Otherwise, parse as number and ensure it's not negative
                  setQuantity(Math.max(0, Number(val)));
                }
              }}
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              autoFocus
            />
          </div>
          {/* might also want user to select/write cancel reason */}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="submit"
            disabled={isPending}
            className="w-full cursor-pointer rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-indigo-700 disabled:hover:cursor-default disabled:hover:bg-indigo-600"
          >
            {cancelItemMutationIsPending ? "Canceling..." : "Cancel Item"}
          </button>
        </div>
      </form>
    </div>
  );
}
