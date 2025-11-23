// src/app/payment/history/page.tsx
"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";
import { formatCurrency } from "~/server/utils/product";
// --- Imports for Filters ---
import { OrderFilterProvider } from "~/app/_contexts/OrderFilterProvider";
import OrderFilters from "~/app/_components/order/OrderFilters";
import OrderLabels from "~/app/_components/order/OrderLabels";
import PageSelector from "~/app/_components/pagination/Pagination";
import { useSearchParams } from "next/navigation";
import { getOrdersInputSchema } from "~/type";

function OrderHistoryContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();

  // Parse URL params to match input schema
  const rawInput = {
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    pageSize: 10,
    id: searchParams.get("id") ?? undefined,
    status:
      searchParams.getAll("status").length > 0
        ? searchParams.getAll("status")
        : undefined,
    dateMin: searchParams.get("dateMin") ?? undefined,
    dateMax: searchParams.get("dateMax") ?? undefined,
    priceMin: searchParams.get("priceMin")
      ? Number(searchParams.get("priceMin"))
      : undefined,
    priceMax: searchParams.get("priceMax")
      ? Number(searchParams.get("priceMax"))
      : undefined,
    carrier: searchParams.get("carrier") ?? undefined,
    trackingNumber: searchParams.get("trackingNumber") ?? undefined,
  };

  // Safely parse with Zod
  const parsedInput = getOrdersInputSchema.safeParse(rawInput);

  const { data, isLoading } = api.order.getMyOrders.useQuery(
    parsedInput.success ? parsedInput.data : {},
    {
      enabled: status === "authenticated" && parsedInput.success,
    },
  );

  if (status === "loading" || isLoading) {
    return <div className="py-10 text-center">Loading order history...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="py-10 text-center">
        Please log in to view your orders.
      </div>
    );
  }

  const orders = data?.orders ?? [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4">
      <h1 className="text-left text-3xl font-bold text-gray-200">
        Order History
      </h1>

      {/* Filters Section */}
      <div className="flex flex-col gap-4">
        <OrderFilters />
        <OrderLabels />
      </div>

      {orders.length === 0 ? (
        <div className="py-10 text-center">
          <h2 className="text-2xl font-bold">No Orders Found</h2>
          <p className="mt-2">Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="overflow-hidden rounded-lg bg-gray-900 shadow-md"
            >
              {/* Order Header */}
              <div className="flex flex-col gap-2 rounded-t-lg bg-gray-800 p-4 text-left sm:flex-row sm:justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-400">
                    ORDER PLACED
                  </span>
                  <span className="text-gray-300">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-400">
                    TOTAL
                  </span>
                  <span className="text-gray-300">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-400">
                    STATUS
                  </span>
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
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-400">
                    ORDER #
                  </span>
                  <span className="font-mono text-xs text-gray-300">
                    {order.id}
                  </span>
                </div>
              </div>

              {/* Shipping Info Section */}
              {(order.status === "shipped" || order.carrier) && (
                <div className="flex flex-col gap-1 border-b border-gray-800 bg-gray-800/50 px-4 py-3 text-left text-sm sm:flex-row sm:gap-6">
                  <div className="flex gap-2">
                    <span className="font-semibold text-gray-400">
                      Carrier:
                    </span>
                    <span className="text-gray-200">
                      {order.carrier || "N/A"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-gray-400">
                      Tracking:
                    </span>
                    <span className="font-mono text-gray-200 select-all">
                      {order.trackingNumber || "N/A"}
                    </span>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="flex flex-col gap-4 p-4">
                {order.orderItems.map((item) => {
                  const variant = item.productVariant;
                  const product = variant.product;
                  const imageUrl =
                    variant.images?.[0] ??
                    "https://placehold.co/100x100/eee/ccc.png?text=No+Image";

                  return (
                    <div key={item.id} className="flex gap-4 text-left">
                      <Image
                        src={imageUrl}
                        alt={product.name ?? "Product image"}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-md border border-gray-700 object-cover"
                      />
                      <div className="flex grow flex-col">
                        <Link
                          href={`/product/${variant.productId}`}
                          className="font-semibold text-gray-300 hover:underline"
                        >
                          {product.name}
                        </Link>
                        <span className="text-sm text-gray-400">
                          {variant.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-gray-300">
                          {formatCurrency(item.priceAtPurchase)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="py-4">
        <PageSelector
          type="product" // Reusing style
          currentPage={data?.currentPage ?? 1}
          totalPages={data?.totalPages ?? 1}
        />
      </div>
    </div>
  );
}

export default function OrderHistoryPage() {
  return (
    <OrderFilterProvider>
      <OrderHistoryContent />
    </OrderFilterProvider>
  );
}
