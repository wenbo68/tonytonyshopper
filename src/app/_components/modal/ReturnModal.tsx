"use client";

import React, { useEffect, useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import toast from "react-hot-toast";
import { handleOverlayClick } from "~/server/utils/modal";
import type { OrderItem } from "~/type";
import { customToast } from "../toast";
import { toastZodError } from "~/server/utils/generic";

// type AdminOrder = RouterOutputs["admin"]["getAllOrders"]["orders"][number];

interface ReturnModalProps {
  orderItem: OrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  // onSuccess: () => Promise<any>;
}

export function ReturnModal({
  orderItem,
  isOpen,
  onClose,
  // onSuccess,
}: ReturnModalProps) {
  const utils = api.useUtils();

  const [quantity, setQuantity] = useState<number | "">("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

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

  // update state when the order item prop changes
  useEffect(() => {
    if (orderItem) {
      setQuantity(orderItem.status === "shipped" ? 1 : orderItem.quantity); //default for return is 1, for canceling return it is all
      setCarrier(
        orderItem.status === "returned" ? (orderItem.returnCarrier ?? "") : "",
      );
      setTrackingNumber(
        orderItem.status === "returned"
          ? (orderItem.returnTrackingNumber ?? "")
          : "",
      );
    }
  }, [orderItem]);

  const invalidateQueries = async () => {
    await utils.order.getUserOrders.invalidate();
  };

  const updateReturnMutation = api.order.updateOrderItemReturn.useMutation({
    onMutate: () => {
      const toastId = customToast.loading("Saving...");
      return { toastId };
    },
    onSuccess: (data, vars, context) => {
      void invalidateQueries();
      customToast.success("Save succeeded.", context?.toastId);
    },
    onError: (error, vars, context) => {
      void invalidateQueries();

      // Zod input validation error
      if (error.data?.zodError) {
        toastZodError(error, context?.toastId);
        return;
      }

      customToast.error(`Save failed. ${error.message}`, context?.toastId);
    },
  });

  const cancelReturnMutation = api.order.cancelOrderItemReturn.useMutation({
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

      // Zod input validation error
      if (error.data?.zodError) {
        toastZodError(error, context?.toastId);
        return;
      }

      // Application-level TRPCError
      customToast.error(error.message, context?.toastId);
    },
  });

  if (!isOpen || !orderItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalQuantity = quantity === "" ? 0 : quantity;
    setQuantity(finalQuantity);

    updateReturnMutation.mutate({
      orderItemId: orderItem.id,
      quantity: finalQuantity,
      carrier,
      trackingNumber,
    });
  };

  const handleCancelReturn = () => {
    // e.preventDefault();
    if (
      confirm(
        "Reverting status to Shipped. Deleting return carrier & tracking number. Continue?",
      )
    ) {
      const finalQuantity = quantity === "" ? 0 : quantity;
      setQuantity(finalQuantity);

      cancelReturnMutation.mutate({
        orderItemId: orderItem.id,
        quantity: finalQuantity,
      });
    }
  };

  const updateReturnMutationIsPending =
    updateReturnMutation.isPending &&
    updateReturnMutation.variables.orderItemId === orderItem.id;
  const cancelReturnMutationIsPending =
    cancelReturnMutation.isPending &&
    cancelReturnMutation.variables.orderItemId === orderItem.id;
  const isPending =
    updateReturnMutationIsPending || cancelReturnMutationIsPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
      onMouseDown={(e) => handleOverlayClick(e, onClose)}
    >
      <form
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex max-h-[80vh] w-sm max-w-[90vw] flex-col gap-4 rounded bg-gray-900 p-4 text-sm"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold">Quantity</label>
            <input
              type="number"
              id="quantity"
              min="1"
              max={orderItem.quantity}
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
              className="w-full rounded bg-gray-800 px-3 py-2 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              autoFocus
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold">Carrier</label>
            <input
              type="text"
              placeholder="e.g., UPS, FedEx"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="rounded bg-gray-800 p-2 outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold">Tracking Number</label>
            <input
              type="text"
              placeholder="e.g., 1Z999AA10123456784"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="rounded bg-gray-800 p-2 outline-none"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          {orderItem.status === "returned" && (
            <button
              type="button"
              onClick={handleCancelReturn}
              disabled={isPending}
              className="w-full cursor-pointer rounded bg-red-600/30 px-4 py-2 font-semibold text-gray-300 transition-all hover:bg-red-600/40 disabled:cursor-default disabled:bg-red-600/20 sm:min-w-30"
            >
              {cancelReturnMutationIsPending ? "Canceling..." : "Cancel Return"}
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="w-full cursor-pointer rounded bg-indigo-600 px-4 py-2 font-semibold text-gray-300 hover:bg-indigo-700 disabled:hover:cursor-default disabled:hover:bg-indigo-600"
          >
            {updateReturnMutationIsPending ? "Saving..." : "Save Return"}
          </button>
        </div>
      </form>
    </div>
  );
}
