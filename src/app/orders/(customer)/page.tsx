"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { api, type RouterOutputs } from "~/trpc/react";
import {
  formatCurrency,
  formatProductOptionsCaption,
} from "~/server/utils/product";
import PageSelector from "~/app/_components/pagination/Pagination";
import { useSearchParams } from "next/navigation";
import { getUserOrdersInputSchema } from "~/type";
import { FaCartPlus, FaPen, FaUndo } from "react-icons/fa";
import toast from "react-hot-toast";
import { useState } from "react";
import OrderDetailsModal from "../../_components/modal/OrderModal";
import { ItemGrid } from "~/app/_components/item/ItemGrid";
import {
  OverlayButton,
  OverlayTag,
} from "~/app/_components/item/ItemImageOverlays";
import { ItemCard } from "~/app/_components/item/ItemCard";
import ReviewModal from "~/app/_components/modal/ReviewModal";
import { useProductVariantModalStore } from "~/app/_hooks/useProductVariantModalStore";

// Infer type for better safety
type Order = RouterOutputs["order"]["getUserOrders"]["orders"][number];

export default function OrdersPage() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const openVariantModal = useProductVariantModalStore(
    (state) => state.openModal,
  );

  // states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewItemIds, setReviewItemIds] = useState<{
    productId: string;
    productVariantId: string;
  } | null>(null);

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
    itemsMin: searchParams.get("itemsMin")
      ? Number(searchParams.get("itemsMin"))
      : undefined,
    itemsMax: searchParams.get("itemsMax")
      ? Number(searchParams.get("itemsMax"))
      : undefined,
    itemName: searchParams.get("itemName") ?? undefined,
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
  const parsedInput = getUserOrdersInputSchema.safeParse(rawInput);

  const { data, isFetching } = api.order.getUserOrders.useQuery(
    parsedInput.success ? parsedInput.data : {},
    {
      enabled: status === "authenticated" && parsedInput.success,
    },
  );

  const handleBuyAgain = (
    e: React.MouseEvent,
    productId: string,
    variantId: string,
    quantity: number,
  ) => {
    e.stopPropagation();
    // Simply open the modal with the ID; fetching happens inside
    openVariantModal(productId, "add", { variantId, quantity });
  };

  const handleReturn = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop click from opening the modal
    toast("Return feature coming soon!", {
      icon: "↩️",
    });
  };

  if (status === "loading" || isFetching) {
    return (
      <div className="animate-pulse text-center">Loading order history...</div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center">Please log in to view your orders.</div>
    );
  }

  const orders = data?.orders ?? [];

  if (orders.length === 0) {
    return (
      <div className="flex flex-col gap-0">
        <h2 className="text-center font-bold">No orders found!</h2>
        {/* <p className="text-center text-sm">Try different filters.</p> */}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-7 md:gap-8 lg:gap-9 xl:gap-10">
      {/* Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Review Modal */}
      <ReviewModal
        itemIds={reviewItemIds}
        isOpen={!!reviewItemIds}
        onClose={() => setReviewItemIds(null)}
      />

      {/* orders */}
      {orders.map((order) => {
        return (
          <div
            key={order.id}
            className="flex flex-col gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8"
          >
            <div className="flex flex-col gap-3">
              {/* Order Header */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <label className="min-w-14 font-semibold">Date:</label>
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
                  <button
                    className="hover: cursor-pointer text-xs font-semibold text-gray-500 hover:text-gray-400"
                    onClick={() => setSelectedOrder(order)}
                  >
                    More Info
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <label className="min-w-14 font-semibold">Items:</label>
                  <span className="">
                    {order.orderItems.reduce(
                      (acc, item) => acc + item.quantity,
                      0,
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <label className="min-w-14 font-semibold">Total:</label>
                  <span className="">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <label className="min-w-14 font-semibold">Status:</label>
                  <span className="capitalize">{order.status}</span>
                </div>
              </div>

              {/* Order Items Grid */}
              <ItemGrid>
                {order.orderItems.map((item) => {
                  const variant = item.productVariant;
                  const product = variant.product;
                  const imageUrl =
                    variant.images?.[0] ??
                    "https://placehold.co/600x600/eee/ccc.png?text=No+Image";

                  return (
                    <ItemCard
                      key={item.id}
                      image={{
                        src: imageUrl,
                        alt: product.name ?? "Product image",
                        href: `/product/${variant.productId}`,
                      }}
                      overlays={
                        <>
                          <OverlayButton
                            position="topLeft"
                            onClick={handleReturn}
                            title="Return Item"
                          >
                            <FaUndo size={12} />
                          </OverlayButton>

                          <OverlayButton
                            position="topRight"
                            onClick={(e) =>
                              handleBuyAgain(
                                e,
                                variant.productId,
                                variant.id,
                                item.quantity,
                              )
                            }
                            onMouseEnter={() =>
                              utils.product.getById.prefetch({
                                id: variant.productId,
                              })
                            }
                            title="Buy Again"
                          >
                            <FaCartPlus size={14} />
                          </OverlayButton>

                          <OverlayTag position="bottomLeft">
                            {formatCurrency(item.priceAtPurchase)} x
                            {item.quantity}
                          </OverlayTag>

                          {/* Only show "Write Review" button if the order is shipped */}
                          {item.status === "shipped" && (
                            <OverlayButton
                              position="bottomRight"
                              onClick={() => {
                                setReviewItemIds({
                                  productId: item.productVariant.productId,
                                  productVariantId: item.productVariantId,
                                });
                              }}
                              title="Write Review"
                            >
                              <FaPen size={12} />
                            </OverlayButton>
                          )}
                        </>
                      }
                    >
                      <Link
                        href={`/product/${variant.productId}`}
                        className="line-clamp-1 text-sm leading-normal font-semibold hover:text-blue-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {product.name}
                      </Link>
                      <p className="line-clamp-1 text-xs leading-normal text-gray-500 capitalize">
                        {formatProductOptionsCaption(variant.options)}
                      </p>
                    </ItemCard>
                  );
                })}
              </ItemGrid>
            </div>
            {order !== orders[orders.length - 1] && (
              <hr className="border-gray-800" />
            )}
          </div>
        );
      })}

      <PageSelector
        type="product" // Reusing style
        currentPage={data?.currentPage ?? 1}
        totalPages={data?.totalPages ?? 1}
      />
    </div>
  );
}
