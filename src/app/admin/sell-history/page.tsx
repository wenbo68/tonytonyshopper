"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";
import { formatCurrency } from "~/server/utils/product";
import { useSearchParams } from "next/navigation";
import PageSelector from "~/app/_components/pagination/Pagination";
import { useState } from "react";
import { ShipOrderModal } from "~/app/_components/admin/ShipModal";
import { getSellHistoryInputSchema } from "~/type";
import SellHistoryFilters from "~/app/_components/admin/SellHistoryFilters";
import SellHistoryLabels from "~/app/_components/admin/SellHistoryLabels";
import { SellHistoryFilterProvider } from "~/app/_contexts/SellHistoryFilterProvider";

function SellHistoryContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;

  // --- NEW: Modal State ---
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);

  // Parse params
  const rawInput = {
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    pageSize: 20,
    id: searchParams.get("id") ?? undefined,
    dateMin: searchParams.get("dateMin") ?? undefined,
    dateMax: searchParams.get("dateMax") ?? undefined,
    customerName: searchParams.get("customerName") ?? undefined,
    customerEmail: searchParams.get("customerEmail") ?? undefined,
    priceMin: searchParams.get("priceMin")
      ? Number(searchParams.get("priceMin"))
      : undefined,
    priceMax: searchParams.get("priceMax")
      ? Number(searchParams.get("priceMax"))
      : undefined,
    status:
      searchParams.getAll("status").length > 0
        ? searchParams.getAll("status")
        : undefined,
    carrier: searchParams.get("carrier") ?? undefined,
    trackingNumber: searchParams.get("trackingNumber") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  };

  const parsedInput = getSellHistoryInputSchema.safeParse(rawInput);

  const { data, isLoading, refetch } = api.admin.getSellHistory.useQuery(
    parsedInput.success ? parsedInput.data : {},
    {
      enabled:
        status === "authenticated" &&
        session?.user?.role === "admin" &&
        parsedInput.success,
    },
  );

  if (status === "loading" || isLoading) {
    return <div className="py-10 text-center">Loading sell history...</div>;
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="py-10 text-center text-red-500">
        Access Denied. Admins only.
      </div>
    );
  }

  if (!data || data.orders.length === 0) {
    return (
      <div className="py-10 text-center">
        <h1 className="text-2xl font-bold">No Sales Found</h1>
        <p className="mt-2">No orders have been placed yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-200">Sell History</h1>
        <Link
          href="/product/all"
          className="rounded bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600"
        >
          Back to Products
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <SellHistoryFilters />
        <SellHistoryLabels />
      </div>

      {/* --- NEW: The Modal --- */}
      <ShipOrderModal
        isOpen={!!shippingOrderId}
        orderId={shippingOrderId}
        onClose={() => setShippingOrderId(null)}
        onSuccess={() => refetch()}
      />

      <div className="flex flex-col gap-6">
        {data.orders.map((order) => {
          const customerName = order.user?.name ?? "Guest";
          const customerEmail =
            order.user?.email ?? order.guestEmail ?? "Unknown";

          return (
            <div
              key={order.id}
              className="overflow-hidden rounded-lg bg-gray-900 shadow-md"
            >
              {/* Order Header */}
              <div className="flex flex-col gap-4 bg-gray-800 p-4 text-sm sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-400">ORDER #</span>
                  <span className="font-mono text-gray-300">{order.id}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-400">DATE</span>
                  <span className="text-gray-300">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "N/A"}{" "}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleTimeString()
                      : ""}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-400">CUSTOMER</span>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-300">
                      {customerName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {customerEmail}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-400">TOTAL</span>
                  <span className="font-bold text-gray-300">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-400">STATUS</span>
                  <span
                    className={`font-bold uppercase ${
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

                {/* --- NEW: Action Button --- */}
                {order.status === "paid" && (
                  <button
                    onClick={() => setShippingOrderId(order.id)}
                    className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    Ship Order
                  </button>
                )}
                {order.status === "shipped" && (
                  <div className="text-right text-xs text-gray-400">
                    <p>{order.carrier}</p>
                    <p className="font-mono">{order.trackingNumber}</p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="divide-y divide-gray-800">
                {order.orderItems.map((item) => {
                  const variant = item.productVariant;
                  const product = variant.product;
                  const imageUrl =
                    variant.images?.[0] ??
                    "https://placehold.co/100x100/eee/ccc.png?text=No+Image";

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 transition hover:bg-gray-800/30"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-gray-700">
                        <Image
                          src={imageUrl}
                          alt={product.name ?? "Product image"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex grow flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-200">
                            {product.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {variant.name}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-6 sm:mt-0">
                          <span className="text-sm text-gray-400">
                            Qty: {item.quantity}
                          </span>
                          <span className="w-20 text-right text-sm font-medium text-gray-300">
                            {formatCurrency(item.priceAtPurchase)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <PageSelector
          type="product" // Using 'product' to keep consistent styling; affects URL hash
          currentPage={data.currentPage}
          totalPages={data.totalPages}
        />
      </div>
    </div>
  );
}

export default function AdminSellHistoryPage() {
  return (
    <SellHistoryFilterProvider>
      <SellHistoryContent />
    </SellHistoryFilterProvider>
  );
}
