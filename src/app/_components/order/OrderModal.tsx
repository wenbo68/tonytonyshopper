"use client";

import { useEffect } from "react";
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
    if (!addressJson) return <span className="text-gray-500">N/A</span>;
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
      return <span className="">Address Unavailable</span>;
    }
  };

  const isShipped = order.status === "shipped";

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Content Box */}
      <div
        className="scrollbar-hide flex max-h-[80vh] w-lg max-w-[90vw] flex-col gap-3 overflow-y-auto rounded bg-gray-900 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-0 text-sm">
          <label className="min-w-14 font-semibold text-gray-500">
            Order ID
          </label>
          <span className="">{order.id}</span>
        </div>
        <div className="flex flex-col gap-0 text-sm">
          <label className="min-w-14 font-semibold text-gray-500">
            Customer Name
          </label>
          <span className="">
            {order.user?.name ?? "Please contact support"}
          </span>
        </div>
        <div className="flex flex-col gap-0 text-sm">
          <label className="min-w-14 font-semibold text-gray-500">
            Customer Email
          </label>
          <span className="">
            {order.user?.email ?? "Please contact support"}
          </span>
        </div>
        <div className="flex flex-col gap-0 text-sm">
          <label className="min-w-14 font-semibold text-gray-500">
            Shipping Address
          </label>
          {renderAddress(order.shippingAddress)}
        </div>
        <div className="flex flex-col gap-0 text-sm">
          <label className="min-w-14 font-semibold text-gray-500">
            Billing Address
          </label>
          {renderAddress(order.billingAddress)}
        </div>
        <div className="flex flex-col gap-0 text-sm">
          <label className="min-w-14 font-semibold text-gray-500">
            Delivery Carrier
          </label>
          <span className="">
            {isShipped
              ? (order.carrier ?? "Please contact support")
              : "Not shipped yet"}
          </span>
        </div>
        <div className="flex flex-col gap-0 text-sm">
          <label className="min-w-14 font-semibold text-gray-500">
            Tracking Number
          </label>
          <span className="">
            {isShipped
              ? (order.trackingNumber ?? "Please contact support")
              : "Not shipped yet"}
          </span>
        </div>
      </div>
    </div>
  );
}
