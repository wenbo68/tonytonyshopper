"use client";

import { useEffect } from "react";
import { FaPlay } from "react-icons/fa";
import { returnReasonDetailsMap } from "~/const";
import type { UserRole } from "~/server/db/schema";
import { handleOverlayClick } from "~/server/utils/modal";
import { formatCurrency } from "~/server/utils/product";
import { api } from "~/trpc/react";
import type { OrderItem } from "~/type";
import Image from "next/image";
import { useMediaModalStore } from "~/app/_hooks/useMediaModalStore";

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
  const openMediaModal = useMediaModalStore((state) => state.open);

  // query for media
  const { data: media, isPending: isPendingMedia } =
    api.orderItem.getReturnMedia.useQuery(
      { orderItemId: shipAndReturnInfoModalProps?.orderItem.id ?? "" },
      { enabled: !!shipAndReturnInfoModalProps && isOpen },
    );

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
        className="scrollbar-hide flex max-h-[90vh] w-lg max-w-[90vw] flex-col gap-3 overflow-y-auto rounded bg-gray-900 p-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {isPendingMedia ? (
          <div className="rounded bg-gray-900 p-6 text-center text-gray-500">
            <p className="animate-pulse">Loading product...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-0">
              <label className="text-sm font-semibold">Shipped</label>
              <div className="flex gap-2 text-sm">
                <label className="font-base min-w-16 text-gray-500">
                  Carrier:
                </label>
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
                  <label className="text-sm font-semibold">
                    Return Requested
                  </label>
                  <div className="flex flex-col gap-1">
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
                      </div>
                    </div>
                    {media && media.returnMedia.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {media.returnMedia.map((mediaItem, index) => (
                          <div
                            key={mediaItem.id}
                            className="relative h-23 w-23 cursor-pointer overflow-hidden rounded border border-gray-700 bg-black hover:opacity-80 sm:h-28 sm:w-28"
                            onClick={() =>
                              openMediaModal(media.returnMedia, index)
                            }
                          >
                            {mediaItem.type === "video" ? (
                              <>
                                <video
                                  src={mediaItem.url}
                                  className="h-full w-full object-contain"
                                  // No controls here
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <FaPlay className="text-gray-300" />
                                </div>
                              </>
                            ) : (
                              <Image
                                src={mediaItem.url}
                                alt="Review media"
                                fill
                                className="object-contain"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {orderItem.rejectReturnReason && (
              <>
                <hr className="border-gray-800" />

                <div className="flex flex-col gap-0">
                  <label className="text-sm font-semibold">
                    Return Rejected
                  </label>
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
                    <label className="text-sm font-semibold">
                      Return Approved
                    </label>
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
          </>
        )}
      </div>
    </div>
  );
}
