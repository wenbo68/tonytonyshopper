"use client";

import { useEffect } from "react";
import { returnReasonDetailsMap } from "~/const";
import type { UserRole } from "~/server/db/schema";
import { handleOverlayClick } from "~/server/utils/modal";
import { formatCurrency } from "~/server/utils/product";
import type { OrderItem } from "~/type";

interface ShipAndReturnInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipAndReturnInfoModalProps: {
    orderItem: OrderItem;
    userRole: UserRole;
  } | null;
}

export default function ShipAndReturnInfoModal({
  isOpen,
  onClose,
  shipAndReturnInfoModalProps,
}: ShipAndReturnInfoModalProps) {
  // Prevent background scrolling when modal is open
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

  if (!isOpen || !shipAndReturnInfoModalProps) return null;

  const { orderItem, userRole } = shipAndReturnInfoModalProps;

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
      onMouseDown={(e) => handleOverlayClick(e, onClose)}
    >
      {/* Modal Content Box */}
      <div
        className="scrollbar-hide flex max-h-[80vh] w-lg max-w-[90vw] flex-col gap-3 overflow-y-auto rounded bg-gray-900 p-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-0">
          <label className="text-sm font-semibold">Shipped</label>
          <div className="flex gap-2 text-sm">
            <label className="font-base min-w-16 text-gray-500">Carrier:</label>
            <span className="">{orderItem.carrier}</span>
          </div>
          <div className="flex gap-2 text-sm">
            <label className="font-base min-w-16 text-gray-500">
              Tracking:
            </label>
            <span className="">{orderItem.trackingNumber}</span>
          </div>
        </div>

        {orderItem.returnReason && (
          <>
            <hr className="border-gray-800" />

            <div className="flex flex-col gap-0">
              <label className="text-sm font-semibold">Return Requested</label>
              <div className="flex gap-2 text-sm">
                <label className="font-base min-w-16 text-gray-500">
                  Reason:
                </label>
                <div className="flex gap-2">
                  <span className="">
                    {orderItem.returnReason}
                    {returnReasonDetailsMap[orderItem.returnReason]
                      .userPaysShipping
                      ? " (Return cost will be deducted from refund)"
                      : " (Free return)"}
                  </span>
                  {/* <span className="">

                  </span> */}
                </div>
              </div>
            </div>
          </>
        )}

        {orderItem.rejectReturnReason && (
          <>
            <hr className="border-gray-800" />

            <div className="flex flex-col gap-0">
              <label className="text-sm font-semibold">Return Rejected</label>
              <div className="flex gap-2 text-sm">
                <label className="font-base min-w-16 text-gray-500">
                  Reason:
                </label>
                <span className="">{orderItem.rejectReturnReason}</span>
              </div>
            </div>
          </>
        )}

        {orderItem.returnCost &&
          orderItem.returnLabel &&
          orderItem.returnCarrier &&
          orderItem.returnTrackingNumber && (
            <>
              <hr className="border-gray-800" />

              <div className="flex flex-col gap-0">
                <label className="text-sm font-semibold">Return Approved</label>
                <div className="flex gap-2 text-sm">
                  <label className="font-base min-w-16 text-gray-500">
                    Cost:
                  </label>
                  <span className="">
                    {formatCurrency(orderItem.returnCost)}
                  </span>
                </div>
                <div className="flex gap-2 text-sm">
                  <label className="font-base min-w-16 text-gray-500">
                    Label:
                  </label>
                  <span className="">{orderItem.returnLabel}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <label className="font-base min-w-16 text-gray-500">
                    Carrier:
                  </label>
                  <span className="">{orderItem.returnCarrier}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <label className="font-base min-w-16 text-gray-500">
                    Tracking:
                  </label>
                  <span className="">{orderItem.returnTrackingNumber}</span>
                </div>
              </div>
            </>
          )}

        {orderItem.refundedAmount && (
          <>
            <hr className="border-gray-800" />

            <div className="flex flex-col gap-0">
              <label className="text-sm font-semibold">Refunded</label>
              <div className="flex gap-2 text-sm">
                <label className="font-base min-w-16 text-gray-500">
                  Amount:
                </label>
                <span className="">
                  {Number(orderItem.refundedAmount) < 0
                    ? userRole === "user"
                      ? 0
                      : formatCurrency(orderItem.refundedAmount)
                    : formatCurrency(orderItem.refundedAmount)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
