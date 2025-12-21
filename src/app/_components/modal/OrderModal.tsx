"use client";

import { useEffect } from "react";
import { handleOverlayClick } from "~/server/utils/modal";
import type { RouterOutputs } from "~/trpc/react";

// Define a union type that accepts either User Order or Admin Order
type UserOrder = RouterOutputs["order"]["getUserOrders"]["orders"][number];
type AdminOrder = RouterOutputs["admin"]["getAllOrders"]["orders"][number];

interface OrderDetailsModalProps {
  order: UserOrder | AdminOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({
  order,
  isOpen,
  onClose,
}: OrderDetailsModalProps) {
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

  if (!isOpen || !order) return null;

  // Helper to safely render JSON address data
  const renderAddress = (addressJson: unknown) => {
    if (!addressJson) return <span className="">N/A</span>;
    try {
      const addr =
        typeof addressJson === "string" ? JSON.parse(addressJson) : addressJson;
      const { line1, line2, city, state, postal_code, country } = addr as any;

      return (
        <div className="flex flex-col">
          <span>{line1},</span>
          {line2 && <span>{line2},</span>}
          <span>
            {city}, {state} {postal_code}, {country}
          </span>
        </div>
        // <span className="">{`${line1}, ${line2 ? `${line2}, ` : ``}${city}, ${state} ${postal_code}, ${country}`}</span>
      );
    } catch (e) {
      return <span className="">N/A</span>;
    }
  };

  const isShipped = order.status === "shipped";

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
          <label className="text-sm font-semibold">Order</label>
          <div className="flex gap-2 text-sm">
            <label className="min-w-16 font-semibold text-gray-500">ID:</label>
            <span className="">{order.id}</span>
          </div>
        </div>

        <hr className="border-gray-800" />

        <div className="flex flex-col gap-0">
          <label className="text-sm font-semibold">Customer</label>
          <div className="flex gap-2 text-sm">
            <label className="min-w-16 font-semibold text-gray-500">
              Name:
            </label>
            <span className="">{order.user?.name ?? "N/A"}</span>
          </div>
          <div className="flex gap-2 text-sm">
            <label className="min-w-16 font-semibold text-gray-500">
              Email:
            </label>
            <span className="">
              {order.user?.email ?? order.guestEmail ?? "N/A"}
            </span>
          </div>
        </div>

        <hr className="border-gray-800" />

        <div className="flex flex-col gap-0">
          <label className="text-sm font-semibold">Address</label>
          <div className="flex gap-2 text-sm">
            <label className="min-w-16 font-semibold text-gray-500">
              Shipping:
            </label>
            {renderAddress(order.shippingAddress)}
          </div>
          <div className="flex gap-2 text-sm">
            <label className="min-w-16 font-semibold text-gray-500">
              Billing:
            </label>
            {renderAddress(order.billingAddress)}
          </div>
        </div>

        <hr className="border-gray-800" />

        <div className="flex flex-col gap-0">
          <label className="text-sm font-semibold">Delivery</label>
          <div className="flex gap-2 text-sm">
            <label className="min-w-16 font-semibold text-gray-500">
              Carrier:
            </label>
            <span className="">
              {isShipped ? (order.carrier ?? "N/A") : "Not shipped yet"}
            </span>
          </div>
          <div className="flex gap-2 text-sm">
            <label className="min-w-16 font-semibold text-gray-500">
              Tracking:
            </label>
            <span className="">
              {isShipped ? (order.trackingNumber ?? "N/A") : "Not shipped yet"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
