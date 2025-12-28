"use client";

import { useEffect } from "react";
import { handleOverlayClick } from "~/server/utils/modal";
import type { OrderItem } from "~/type";

interface ShipInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItem: OrderItem | null;
}

export default function ShipInfoModal({
  isOpen,
  onClose,
  orderItem,
}: ShipInfoModalProps) {
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

  if (!isOpen || !orderItem) return null;

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
          <label className="text-sm font-semibold">Delivery</label>
          <div className="flex gap-2 text-sm">
            <label className="font-base min-w-16 text-gray-500">Carrier:</label>
            <span className="">{orderItem.carrier} </span>
          </div>
          <div className="flex gap-2 text-sm">
            <label className="font-base min-w-16 text-gray-500">
              Tracking:
            </label>
            <span className="">{orderItem.trackingNumber} </span>
          </div>
        </div>

        {orderItem.returnCarrier && orderItem.returnTrackingNumber && (
          <>
            <hr className="border-gray-800" />

            <div className="flex flex-col gap-0">
              <label className="text-sm font-semibold">Return</label>
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
      </div>
    </div>
  );
}
