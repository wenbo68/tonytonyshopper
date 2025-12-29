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
import { getUserOrdersInputSchema, type OrderItem } from "~/type";
import { FaCartPlus, FaEllipsisV, FaPen, FaUndo } from "react-icons/fa";
// import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import OrderModal from "../../_components/modal/OrderModal";
import { ItemGrid } from "~/app/_components/item/ItemGrid";
import {
  // OverlayButton,
  OverlayDiv,
  OverlayTag,
  OverlayTagButton,
} from "~/app/_components/item/ItemImageOverlays";
import { ItemCard } from "~/app/_components/item/ItemCard";
import ReviewModal from "~/app/_components/modal/ReviewModal";
import { useProductVariantModalStore } from "~/app/_hooks/useProductVariantModalStore";
// import { customToast } from "~/app/_components/toast";
import CancelModal from "~/app/_components/modal/CancelModal";
import { customToast } from "~/app/_components/toast";
import ShipInfoModal from "~/app/_components/modal/ShipInfoModal";
import { FaXmark } from "react-icons/fa6";
import { ReturnModal } from "~/app/_components/modal/ReturnModal";
import { GiOpenBook } from "react-icons/gi";

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
  const [cancelModalProps, setCancelModalProps] = useState<{
    orderItemId: string;
    maxQuantity: number;
  } | null>(null);
  const [shipInfoModalProps, setShipInfoModalProps] =
    useState<OrderItem | null>(null);
  const [reviewModalProps, setReviewModalProps] = useState<{
    productId: string;
    productVariantId: string;
  } | null>(null);
  const [returnModalProps, setReturnModalProps] = useState<OrderItem | null>(
    null,
  );
  const [dropdownItemId, setDropdownItemId] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setDropdownItemId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

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
    sort: searchParams.get("sort") ?? undefined,
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
    setDropdownItemId(null); // Close menu
  };

  const handleCancel = (
    e: React.MouseEvent,
    orderItemId: string,
    maxQuantity: number,
  ) => {
    e.stopPropagation(); // Stop click from opening the modal
    setCancelModalProps({ orderItemId, maxQuantity });
    setDropdownItemId(null); // Close menu
  };

  const handleReview = (
    e: React.MouseEvent,
    productId: string,
    productVariantId: string,
  ) => {
    e.stopPropagation();
    setReviewModalProps({
      productId,
      productVariantId,
    });
    setDropdownItemId(null); // Close menu
  };

  const handleReturn = (e: React.MouseEvent, orderItem: OrderItem) => {
    e.stopPropagation(); // Stop click from opening the modal
    setReturnModalProps(orderItem);
    setDropdownItemId(null); // Close menu
  };

  const toggleMenu = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation(); // Prevent window click listener from immediately closing it
    setDropdownItemId(dropdownItemId === itemId ? null : itemId);
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
      {/* Modals */}
      <OrderModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
      <CancelModal
        cancelModalProps={cancelModalProps}
        // itemQuantity={}
        isOpen={!!cancelModalProps}
        onClose={() => setCancelModalProps(null)}
      />
      <ShipInfoModal
        isOpen={!!shipInfoModalProps}
        onClose={() => setShipInfoModalProps(null)}
        orderItem={shipInfoModalProps}
      />
      <ReviewModal
        itemIds={reviewModalProps}
        isOpen={!!reviewModalProps}
        onClose={() => setReviewModalProps(null)}
      />
      <ReturnModal
        isOpen={!!returnModalProps}
        onClose={() => setReturnModalProps(null)}
        orderItem={returnModalProps}
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
                {/* <div className="flex items-center gap-2 text-sm">
                  <label className="min-w-14 font-semibold">Status:</label>
                  <span className="capitalize">{order.status}</span>
                </div> */}
              </div>

              {/* Order Items Grid */}
              <ItemGrid>
                {order.orderItems.map((item) => {
                  const variant = item.productVariant;
                  const product = variant.product;
                  const imageUrl =
                    variant.images?.[0] ??
                    "https://placehold.co/600x600/eee/ccc.png?text=No+Image";
                  const isMenuOpen = dropdownItemId === item.id;

                  const itemMenuPrefetch = () => {
                    utils.product.getById.prefetch({ id: variant.productId });
                  };

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
                          {item.status === "shipped" ||
                          item.status === "returned" ? (
                            <OverlayTagButton
                              position="topLeft"
                              className="capitalize"
                              onClick={() => {
                                if (!item.carrier || !item.trackingNumber) {
                                  customToast.error(
                                    "Delivery info missing. Please contact support.",
                                  );
                                  return;
                                }
                                setShipInfoModalProps(item);
                              }}
                            >
                              {item.status}
                            </OverlayTagButton>
                          ) : (
                            item.status && (
                              <OverlayTag
                                position="topLeft"
                                className="capitalize"
                              >
                                {item.status}
                              </OverlayTag>
                            )
                          )}
                          <OverlayTag position="bottomLeft">
                            {formatCurrency(item.priceAtPurchase)} x
                            {item.quantity}
                          </OverlayTag>
                          <OverlayDiv
                            position="topRight"
                            className="z-20" // Higher z-index so dropdown floats over other tags
                            title="Item Options"
                            // onMouseEnter={itemMenuPrefetch} // Desktop prefetch
                            onClick={(e) => {
                              itemMenuPrefetch(); // Mobile prefetch
                              toggleMenu(e, item.id);
                            }}
                          >
                            <FaEllipsisV size={14} />

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div className="absolute top-8 right-0 z-50 flex min-w-36 flex-col rounded bg-gray-800 p-1 text-left text-xs font-semibold text-gray-400 transition-all">
                                {/* Buy Again */}
                                <button
                                  onClick={(e) =>
                                    handleBuyAgain(
                                      e,
                                      variant.productId,
                                      variant.id,
                                      item.quantity,
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded p-2 hover:cursor-pointer hover:bg-gray-900 hover:text-blue-400"
                                >
                                  <div className="item-center flex min-w-4 justify-center">
                                    <FaCartPlus className="text-gray-400" />
                                  </div>
                                  Buy again
                                </button>

                                {/* Return */}
                                {item.status === "paid" && (
                                  <button
                                    onClick={(e) =>
                                      handleCancel(e, item.id, item.quantity)
                                    }
                                    className="flex w-full items-center gap-2 rounded p-2 hover:cursor-pointer hover:bg-gray-900 hover:text-blue-400"
                                  >
                                    <div className="item-center flex min-w-4 justify-center">
                                      <FaXmark className="text-gray-400" />
                                    </div>
                                    Cancel item
                                  </button>
                                )}

                                {/* Review */}
                                {(item.status === "shipped" ||
                                  item.status === "returned" ||
                                  item.status === "refunded") && (
                                  <button
                                    onClick={(e) =>
                                      handleReview(
                                        e,
                                        variant.productId,
                                        item.productVariantId,
                                      )
                                    }
                                    className="flex w-full items-center gap-2 rounded p-2 hover:cursor-pointer hover:bg-gray-900 hover:text-blue-400"
                                  >
                                    <div className="item-center flex min-w-4 justify-center">
                                      <GiOpenBook
                                        size={13}
                                        className="text-gray-400"
                                      />
                                    </div>
                                    Write review
                                  </button>
                                )}

                                {/* Return */}
                                {item.status === "shipped" && (
                                  <button
                                    onClick={(e) => handleReturn(e, item)}
                                    className="flex w-full items-center gap-2 rounded p-2 hover:cursor-pointer hover:bg-gray-900 hover:text-blue-400"
                                  >
                                    <div className="item-center flex min-w-4 justify-center">
                                      <FaUndo
                                        size={10}
                                        className="text-gray-400"
                                      />
                                    </div>
                                    Return item
                                  </button>
                                )}

                                {/* Edit Return */}
                                {item.status === "returned" && (
                                  <button
                                    onClick={(e) => handleReturn(e, item)}
                                    className="flex w-full items-center gap-2 rounded p-2 hover:cursor-pointer hover:bg-gray-900 hover:text-blue-400"
                                  >
                                    <div className="item-center flex min-w-4 justify-center">
                                      <FaPen
                                        size={10}
                                        className="text-gray-400"
                                      />
                                    </div>
                                    Edit Return
                                  </button>
                                )}
                              </div>
                            )}
                          </OverlayDiv>
                          {/* <OverlayButton
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
                          )} */}
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
