// tonytonyshopper/src/app/_components/order/OrderDetailsModal.tsx

"use client";

import { useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import Link from "next/link";
import { formatCurrency, formatOptionsCaption } from "~/server/utils/product";
import { ImageCard, OverlayTag, ProductGrid } from "../ProductImageCard";
import type { RouterOutputs } from "~/trpc/react";

// 1. Infer the Order type from the tRPC router output
type Order = RouterOutputs["order"]["getMyOrders"]["orders"][number];

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({
  order,
  isOpen,
  onClose,
}: OrderDetailsModalProps) {
  // 2. Prevent background scrolling when modal is open
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

  // 3. Helper to safely render JSON address data
  const renderAddress = (addressJson: unknown) => {
    if (!addressJson) return <span className="text-gray-500">N/A</span>;
    try {
      // It might be already parsed object or a string depending on how it came from DB/Stripe
      const addr =
        typeof addressJson === "string" ? JSON.parse(addressJson) : addressJson;

      // Common Stripe address fields
      const { line1, line2, city, state, postal_code, country } = addr as any;

      return (
        <div className="flex flex-col text-sm text-gray-300">
          <span>{line1}</span>
          {line2 && <span>{line2}</span>}
          <span>
            {city}, {state} {postal_code}
          </span>
          <span>{country}</span>
        </div>
      );
    } catch (e) {
      return <span className="text-gray-500">Address Unavailable</span>;
    }
  };

  const isShipped = order.status === "shipped";

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Content Box */}
      <div
        className="scrollbar-thin relative flex max-h-[90vh] w-full max-w-4xl flex-col gap-6 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-200">Order Details</h2>
            <span className="font-mono text-xs text-gray-500">#{order.id}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Column 1: Status & Shipping */}
          <div className="flex flex-col gap-6">
            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4 rounded-md bg-gray-950/50 p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Date
                </span>
                <span className="text-sm text-gray-300">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Total
                </span>
                <span className="text-sm font-bold text-gray-200">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Status
                </span>
                <span
                  className={`text-sm font-bold capitalize ${
                    order.status === "paid"
                      ? "text-green-400"
                      : order.status === "shipped"
                        ? "text-blue-400"
                        : order.status === "cancelled"
                          ? "text-red-400"
                          : "text-yellow-400"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>

            {/* Carrier Info */}
            <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase">
                Shipment
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Carrier</span>
                  <span className="text-sm text-gray-300">
                    {isShipped ? order.carrier || "N/A" : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Tracking #</span>
                  <span className="font-mono text-sm text-gray-300 select-all">
                    {isShipped ? order.trackingNumber || "N/A" : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Addresses */}
          <div className="flex flex-col gap-6 md:border-l md:border-gray-800 md:pl-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-gray-400 uppercase">
                Shipping Address
              </h3>
              {renderAddress(order.shippingAddress)}
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-gray-400 uppercase">
                Billing Address
              </h3>
              {renderAddress(order.billingAddress)}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="flex flex-col gap-4 border-t border-gray-800 pt-6">
          <h3 className="font-bold text-gray-300">
            Items ({order.orderItems.length})
          </h3>
          <ProductGrid className="!grid-cols-2 sm:!grid-cols-3 md:!grid-cols-4 lg:!grid-cols-5">
            {order.orderItems.map((item) => {
              const variant = item.productVariant;
              const product = variant.product;
              const imageUrl =
                variant.images?.[0] ??
                "https://placehold.co/600x600/eee/ccc.png?text=No+Image";

              return (
                <div key={item.id} className="flex flex-col gap-2">
                  <ImageCard
                    src={imageUrl}
                    alt={product.name}
                    href={`/product/${variant.productId}`}
                  >
                    <OverlayTag position="bottomLeft">
                      {formatCurrency(item.priceAtPurchase)} x{item.quantity}
                    </OverlayTag>
                  </ImageCard>
                  <div className="flex flex-col gap-0 px-1">
                    <Link
                      href={`/product/${variant.productId}`}
                      className="line-clamp-1 text-sm font-semibold text-gray-300 hover:text-blue-400"
                    >
                      {product.name}
                    </Link>
                    <p className="line-clamp-1 text-xs text-gray-500 capitalize">
                      {formatOptionsCaption(variant.options)}
                    </p>
                  </div>
                </div>
              );
            })}
          </ProductGrid>
        </div>
      </div>
    </div>
  );
}
