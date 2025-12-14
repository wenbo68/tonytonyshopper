"use client";

import { useEffect, useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import toast from "react-hot-toast";

type AdminOrder = RouterOutputs["admin"]["getAllOrders"]["orders"][number];

interface ShipOrderModalProps {
  order: AdminOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShipOrderModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: ShipOrderModalProps) {
  // Initialize with empty strings
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  // update state when the 'order' prop changes
  useEffect(() => {
    if (order) {
      setCarrier(order.status === "shipped" ? (order.carrier ?? "") : "");
      setTrackingNumber(
        order.status === "shipped" ? (order.trackingNumber ?? "") : "",
      );
    }
  }, [order]);

  const updateShippingInfoMutation = api.admin.updateShippingInfo.useMutation({
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

  const revertToPaidMutation = api.admin.revertToPaid.useMutation({
    onSuccess: () => {
      toast.success("Order reverted to Paid status!");
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrier.trim() || !trackingNumber.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    updateShippingInfoMutation.mutate({
      orderId: order.id,
      carrier,
      trackingNumber,
    });
  };

  // --- ADDED: Revert Handler ---
  const handleRevert = () => {
    if (
      confirm("Are you sure you want to revert this order to 'Paid' status?")
    ) {
      revertToPaidMutation.mutate({ orderId: order.id });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex max-h-[80vh] w-sm max-w-[90vw] flex-col gap-4 rounded bg-gray-900 p-4"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 text-sm">
            <label className="font-semibold">Carrier</label>
            <input
              type="text"
              placeholder="e.g., UPS, FedEx"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="rounded bg-gray-800 p-2 outline-none"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <label className="font-semibold">Tracking Number</label>
            <input
              type="text"
              placeholder="e.g., 1Z999AA10123456784"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="rounded bg-gray-800 p-2 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          {order.status === "shipped" && (
            <button
              type="button"
              onClick={handleRevert}
              disabled={revertToPaidMutation.isPending}
              className="w-full cursor-pointer rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-indigo-700 disabled:hover:cursor-default disabled:hover:bg-indigo-600"
            >
              {revertToPaidMutation.isPending
                ? "Canceling..."
                : "Cancel Shipment"}
            </button>
          )}
          <button
            type="submit"
            disabled={updateShippingInfoMutation.isPending}
            className="w-full cursor-pointer rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-indigo-700 disabled:hover:cursor-default disabled:hover:bg-indigo-600"
          >
            {updateShippingInfoMutation.isPending
              ? "Saving..."
              : "Save Shipment"}
          </button>
        </div>
      </form>
    </div>
  );
}
