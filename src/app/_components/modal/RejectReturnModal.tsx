"use client";

import React, { useEffect, useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
// import toast from "react-hot-toast";
import { handleOverlayClick } from "~/server/utils/modal";
import type { OrderItem } from "~/type";
import { customToast } from "../toast";
import { toastZodError } from "~/server/utils/generic";
import { Dropdown } from "../Dropdown";
import {
  type RejectReturnReason,
  type ReturnReason,
  returnReasonEnum,
} from "~/server/db/schema";
import {
  rejectReturnReasonOptions,
  returnReasonConst,
  returnReasonDetailsMap,
  returnReasonOptions,
} from "~/const";

// type AdminOrder = RouterOutputs["admin"]["getAllOrders"]["orders"][number];

interface RejectReturnModalProps {
  orderItem: OrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  // onSuccess: () => Promise<any>;
}

export function RejectReturnModal({
  orderItem,
  isOpen,
  onClose,
  // onSuccess,
}: RejectReturnModalProps) {
  const utils = api.useUtils();

  const [quantity, setQuantity] = useState<number | "">("");
  const [rejectReturnReason, setRejectReturnReason] = useState<string>("");

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
      setQuantity(orderItem.status === "shipped" ? 1 : orderItem.quantity);
      setRejectReturnReason(orderItem.rejectReturnReason ?? "");
    }
  }, [orderItem]);

  const invalidateQueries = async () => {
    await utils.order.getAdminOrders.invalidate();
  };

  const rejectReturnMutation = api.orderItem.rejectOrderItemReturn.useMutation({
    onMutate: () => {
      const toastId = customToast.loading("Rejecting...");
      return { toastId };
    },
    onSuccess: (data, vars, context) => {
      void invalidateQueries();
      customToast.success("Reject succeeded.", context?.toastId);
    },
    onError: (error, vars, context) => {
      void invalidateQueries();

      // Zod input validation error
      if (error.data?.zodError) {
        toastZodError(error, context?.toastId);
        return;
      }

      customToast.error(`Reject failed. ${error.message}`, context?.toastId);
    },
  });

  // const cancelReturnMutation = api.orderItem.cancelOrderItemReturn.useMutation({
  //   onMutate: () => {
  //     const toastId = customToast.loading("Canceling...");
  //     return { toastId };
  //   },
  //   onSuccess: (data, vars, context) => {
  //     void invalidateQueries();
  //     customToast.success("Cancel succeeded.", context?.toastId);
  //   },
  //   onError: (error, vars, context) => {
  //     void invalidateQueries();

  //     // Zod input validation error
  //     if (error.data?.zodError) {
  //       toastZodError(error, context?.toastId);
  //       return;
  //     }

  //     // Application-level TRPCError
  //     customToast.error(error.message, context?.toastId);
  //   },
  // });

  if (!isOpen || !orderItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalQuantity = quantity === "" ? 0 : quantity;
    setQuantity(finalQuantity);

    rejectReturnMutation.mutate({
      orderItemId: orderItem.id,
      quantity: finalQuantity,
      rejectReturnReason: rejectReturnReason as RejectReturnReason,
    });
  };

  // const handleCancelReturn = () => {
  //   // e.preventDefault();
  //   if (
  //     confirm(
  //       "Reverting status to Shipped. Deleting return carrier & tracking number. Continue?",
  //     )
  //   ) {
  //     const finalQuantity = quantity === "" ? 0 : quantity;
  //     setQuantity(finalQuantity);

  //     cancelReturnMutation.mutate({
  //       orderItemId: orderItem.id,
  //       quantity: finalQuantity,
  //     });
  //   }
  // };

  const rejectReturnMutationIsPending =
    rejectReturnMutation.isPending &&
    rejectReturnMutation.variables.orderItemId === orderItem.id;
  // const cancelReturnMutationIsPending =
  //   cancelReturnMutation.isPending &&
  //   cancelReturnMutation.variables.orderItemId === orderItem.id;
  const isPending = rejectReturnMutationIsPending;
  // || cancelReturnMutationIsPending;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-1 bg-black backdrop-blur-sm"
      onMouseDown={(e) => handleOverlayClick(e, onClose)}
    >
      {/* {rejectReturnReason === "" ? null : returnReasonDetailsMap[
          rejectReturnReason as ReturnReason
        ].userPaysShipping ? (
        <span className="text-sm text-red-400">
          Return shipping fee will be deducted from the refund.
        </span>
      ) : (
        <span className="text-sm text-lime-400">Free return!</span>
      )} */}
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
            <label className="font-semibold">Reason</label>
            <Dropdown
              options={rejectReturnReasonOptions}
              value={rejectReturnReason}
              onChange={(newValue) => setRejectReturnReason(newValue)}
              triggerColor="bg-gray-800"
              menuColor="bg-gray-700"
              // menuRingColor="bg-gray-600"
              menuHighlightColor="hover:bg-gray-800"
            />
          </div>
        </div>

        {/* <div className="flex flex-col gap-1"> */}
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* {orderItem.status === "returned" && (
            <button
              type="button"
              onClick={handleCancelReturn}
              disabled={isPending}
              className="w-full cursor-pointer rounded bg-red-600/30 px-4 py-2 font-semibold text-gray-300 transition-all hover:bg-red-600/40 disabled:cursor-default disabled:bg-red-600/20 sm:min-w-30"
            >
              {cancelReturnMutationIsPending ? "Canceling..." : "Cancel Return"}
            </button>
          )} */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full cursor-pointer rounded bg-indigo-600 px-4 py-2 font-semibold text-gray-300 hover:bg-indigo-700 disabled:hover:cursor-default disabled:hover:bg-indigo-600"
          >
            {rejectReturnMutationIsPending ? "Rejecting..." : "Reject"}
          </button>
        </div>
        {/* </div> */}
      </form>
    </div>
  );
}
