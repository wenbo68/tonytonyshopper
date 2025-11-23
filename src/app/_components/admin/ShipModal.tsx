"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import toast from "react-hot-toast";

interface ShipOrderModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShipOrderModal({
  orderId,
  isOpen,
  onClose,
  onSuccess,
}: ShipOrderModalProps) {
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const markShippedMutation = api.admin.markAsShipped.useMutation({
    onSuccess: () => {
      toast.success("Order marked as shipped!");
      // Reset form
      setCarrier("");
      setTrackingNumber("");
      onSuccess(); // Trigger refresh in parent
      onClose();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  if (!isOpen || !orderId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrier.trim() || !trackingNumber.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    markShippedMutation.mutate({
      orderId,
      carrier,
      trackingNumber,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-xl font-bold text-gray-200">Fulfill Order</h2>
        <p className="mb-4 text-sm text-gray-400">
          Enter shipping details for Order #{orderId?.slice(0, 8)}...
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-400">
              Carrier
            </label>
            <input
              type="text"
              placeholder="e.g. FedEx, USPS, UPS"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="rounded-md bg-gray-800 p-2 text-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-400">
              Tracking Number
            </label>
            <input
              type="text"
              placeholder="e.g. 1Z999AA10123456784"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="rounded-md bg-gray-800 p-2 text-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={markShippedMutation.isPending}
              className="rounded-md px-4 py-2 text-sm font-semibold text-gray-400 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={markShippedMutation.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {markShippedMutation.isPending ? "Saving..." : "Mark as Shipped"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
