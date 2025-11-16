"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";
import { formatCurrency } from "~/server/utils/product";

export default function OrderHistoryPage() {
  const { data: session, status } = useSession();
  const { data: orders, isLoading } = api.order.getMyOrders.useQuery(
    undefined,
    {
      enabled: status === "authenticated",
    },
  );

  if (status === "loading" || isLoading) {
    return <div className="text-center">Loading order history...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center">Please log in to view your orders.</div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">No Orders Found</h1>
        <p className="mt-2">You haven't placed any orders yet.</p>
        <Link
          href="/product/all"
          className="mt-4 inline-block text-blue-400 hover:underline"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-3xl font-bold text-gray-200">Order History</h1>
      <div className="flex flex-col gap-6">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg bg-gray-900 shadow-md">
            {/* Order Header */}
            <div className="flex flex-col gap-2 rounded-t-lg bg-gray-800 p-4 sm:flex-row sm:justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-400">
                  ORDER PLACED
                </span>
                <span className="text-gray-300">
                  {new Date(order.createdAt!).toLocaleDateString()}
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
                <span className="font-medium text-blue-400 capitalize">
                  {order.status}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-400">
                  ORDER #
                </span>
                <span className="text-xs text-gray-300">{order.id}</span>
              </div>
            </div>

            {/* Order Items */}
            <div className="flex flex-col gap-4 p-4">
              {order.orderItems.map((item) => {
                const variant = item.productVariant;
                const product = variant.product;
                const imageUrl =
                  variant.images?.[0] ??
                  "https://placehold.co/100x100/eee/ccc.png?text=No+Image";

                return (
                  <div key={item.id} className="flex gap-4">
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
    </div>
  );
}
