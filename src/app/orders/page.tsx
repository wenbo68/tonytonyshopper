"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";
import { formatCurrency, formatOptionsCaption } from "~/server/utils/product";
import { OrderFilterProvider } from "~/app/_contexts/OrderFilterProvider";
import OrderFilters from "~/app/_components/order/OrderFilters";
import OrderLabels from "~/app/_components/order/OrderLabels";
import PageSelector from "~/app/_components/pagination/Pagination";
import { useSearchParams } from "next/navigation";
import { getOrdersInputSchema } from "~/type";
import { FaCartPlus, FaUndo } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  ImageCard,
  OverlayButton,
  OverlayTag,
  ProductGrid,
} from "../_components/ProductImageCard";

function OrderHistoryContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const utils = api.useUtils();

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

  // Mutation to add item to cart
  const addToCartMutation = api.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Added to cart");
      utils.cart.get.invalidate();
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });

  const handleAddToCart = (variantId: string) => {
    addToCartMutation.mutate({ productVariantId: variantId, quantity: 1 });
  };

  const handleReturn = () => {
    toast("Return feature coming soon!", {
      icon: "↩️",
    });
  };

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
    <div className="mx-auto flex flex-col gap-6">
      <h1 className="text-left text-2xl font-bold text-gray-300">
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
            <div key={order.id} className="rounded bg-gray-900">
              {/* Order Header */}
              <div className="flex flex-col gap-1">
                {/* <div className="flex items-center gap-2 text-sm">
                  <label className="min-w-16 font-semibold text-gray-300">
                    Order ID:
                  </label>
                  <span className="">{order.id}</span>
                </div> */}
                <div className="flex items-center gap-2 text-sm">
                  <label className="min-w-16 font-semibold text-gray-300">
                    Date:
                  </label>
                  <span className="">
                    {new Date(order.createdAt).toLocaleString("ja-JP", {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <label className="min-w-16 font-semibold text-gray-300">
                    Total:
                  </label>
                  <span className="">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <label className="min-w-16 font-semibold text-gray-300">
                    Status:
                  </label>
                  <span className="capitalize">{order.status}</span>
                </div>
              </div>
              {/* Shipping Info Section */}
              {/* {(order.status === "shipped" || order.carrier) && (
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
              )} */}
              {/* Order Items Grid */}
              <div className="p-4">
                <ProductGrid>
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
                          alt={product.name ?? "Product image"}
                          href={`/product/${variant.productId}`}
                        >
                          {/* Return Button */}
                          <OverlayButton
                            position="topLeft"
                            onClick={handleReturn}
                            title="Return Item"
                          >
                            <FaUndo size={12} />
                          </OverlayButton>

                          {/* Buy Again Button */}
                          <OverlayButton
                            position="topRight"
                            onClick={() => handleAddToCart(variant.id)}
                            disabled={addToCartMutation.isPending}
                            title="Buy Again"
                          >
                            <FaCartPlus size={14} />
                          </OverlayButton>

                          {/* Price Tag */}
                          <OverlayTag position="bottomLeft">
                            {formatCurrency(item.priceAtPurchase)} x
                            {item.quantity}
                          </OverlayTag>
                        </ImageCard>

                        <div className="flex flex-col gap-0 px-1">
                          {/* ... Name and Options ... */}
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
