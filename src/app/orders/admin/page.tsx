"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { api, type RouterOutputs } from "~/trpc/react";
import {
  formatCurrency,
  formatProductOptionsCaption,
} from "~/server/utils/product";
import { useSearchParams } from "next/navigation";
import PageSelector from "~/app/_components/pagination/Pagination";
import { useState } from "react";
import { getAdminOrdersInputSchema, type OrderItem } from "~/type";
import OrderModal from "~/app/_components/modal/OrderModal";
import { ShipModal } from "~/app/_components/modal/ShipModal";
import { ItemGrid } from "~/app/_components/item/ItemGrid";
import {
  OverlayButton,
  OverlayDiv,
  OverlayTag,
  OverlayTagButton,
} from "~/app/_components/item/ItemImageOverlays";
import { ItemCard } from "~/app/_components/item/ItemCard";
import { MdLocalShipping } from "react-icons/md";
import { RiRefundFill } from "react-icons/ri";
import { FaCheck, FaEllipsisV, FaPen } from "react-icons/fa";
import { customToast } from "~/app/_components/toast";
import ShipAndReturnInfoModal from "~/app/_components/modal/ShipAndReturnInfoModal";
import { FaXmark } from "react-icons/fa6";
import { RejectReturnModal } from "~/app/_components/modal/RejectReturnModal";
import { ApproveReturnModal } from "~/app/_components/modal/ApproveReturnModal";
import { RefundModal } from "~/app/_components/modal/RefundModal";

type AdminOrder = RouterOutputs["order"]["getAdminOrders"]["orders"][number];

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  // --- Modal State ---
  const [shipModalProps, setShipModalProps] = useState<OrderItem | null>(null);
  const [rejectReturnModalProps, setRejectReturnModalProps] =
    useState<OrderItem | null>(null);
  const [approveReturnModalProps, setApproveReturnModalProps] =
    useState<OrderItem | null>(null);
  const [refundModalProps, setRefundModalProps] = useState<OrderItem | null>(
    null,
  );
  const [orderModalProps, setOrderModalProps] = useState<AdminOrder | null>(
    null,
  );
  const [shipInfoModalProps, setShipInfoModalProps] =
    useState<OrderItem | null>(null);
  const [dropdownItemId, setDropdownItemId] = useState<string | null>(null);

  // Parse params
  const rawInput = {
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    pageSize: 20,
    id: searchParams.get("id") ?? undefined,
    dateMin: searchParams.get("dateMin") ?? undefined,
    dateMax: searchParams.get("dateMax") ?? undefined,
    customerName: searchParams.get("customerName") ?? undefined,
    customerEmail: searchParams.get("customerEmail") ?? undefined,
    itemsMin: searchParams.get("itemsMin")
      ? Number(searchParams.get("itemsMin"))
      : undefined,
    itemsMax: searchParams.get("itemsMax")
      ? Number(searchParams.get("itemsMax"))
      : undefined,
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

  const parsedInput = getAdminOrdersInputSchema.safeParse(rawInput);

  const { data, isFetching, refetch } = api.order.getAdminOrders.useQuery(
    parsedInput.success ? parsedInput.data : {},
    {
      enabled:
        status === "authenticated" &&
        session?.user?.role === "admin" &&
        parsedInput.success,
    },
  );

  if (status === "loading" || isFetching) {
    return (
      <div className="animate-pulse text-center">Loading sales history...</div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return <div className="text-center">Unauthorized.</div>;
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

  const handleRejectReturn = (e: React.MouseEvent, orderItem: OrderItem) => {
    e.stopPropagation(); // Prevent window click listener from immediately closing it
    setRejectReturnModalProps(orderItem);
  };
  const handleApproveReturn = (e: React.MouseEvent, orderItem: OrderItem) => {
    e.stopPropagation(); // Prevent window click listener from immediately closing it
    setApproveReturnModalProps(orderItem);
  };
  const handleRefund = (e: React.MouseEvent, orderItem: OrderItem) => {
    e.stopPropagation(); // Prevent window click listener from immediately closing it
    setRefundModalProps(orderItem);
  };
  const toggleMenu = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation(); // Prevent window click listener from immediately closing it
    setDropdownItemId(dropdownItemId === itemId ? null : itemId);
  };

  return (
    <>
      <OrderModal
        isOpen={!!orderModalProps}
        onClose={() => setOrderModalProps(null)}
        order={orderModalProps}
      />

      <ShipModal
        isOpen={!!shipModalProps}
        onClose={() => setShipModalProps(null)}
        orderItem={shipModalProps}
      />

      <ShipAndReturnInfoModal
        isOpen={!!shipInfoModalProps}
        onClose={() => setShipInfoModalProps(null)}
        orderItem={shipInfoModalProps}
      />

      <RejectReturnModal
        isOpen={!!rejectReturnModalProps}
        onClose={() => setRejectReturnModalProps(null)}
        orderItem={rejectReturnModalProps}
      />

      <ApproveReturnModal
        isOpen={!!approveReturnModalProps}
        onClose={() => setApproveReturnModalProps(null)}
        orderItem={approveReturnModalProps}
      />

      <RefundModal
        isOpen={!!refundModalProps}
        onClose={() => setRefundModalProps(null)}
        orderItem={refundModalProps}
      />

      <div className="flex flex-col gap-7 sm:gap-8 md:gap-9 lg:gap-10 xl:gap-11">
        {/* orders */}
        {orders.map((order) => {
          return (
            <div
              key={order.id}
              className="flex flex-col gap-5 sm:gap-6 md:gap-7 lg:gap-8 xl:gap-9"
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
                      onClick={() => setOrderModalProps(order)}
                    >
                      More Info
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <label className="min-w-14 font-semibold">Cstmr:</label>
                    <span className="">
                      {order.user?.name ??
                        order.user?.email ??
                        order.guestEmail}
                    </span>
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
                    <span className="">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <label className="min-w-14 font-semibold">Status:</label>
                      <span className="capitalize">{order.status}</span>
                    </div>
                    {/* {(order.status === "paid" ||
                      order.status === "shipped") && (
                      <button
                        className="hover: cursor-pointer text-xs font-semibold text-gray-500 hover:text-gray-400"
                        onClick={() => setShippingOrder(order)}
                      >
                        Ship
                      </button>
                    )} */}
                  </div>
                </div>

                {/* Order Items Grid */}
                <ItemGrid>
                  {order.orderItems.map((item) => {
                    const variant = item.productVariant;
                    const product = variant.product;
                    const imageUrl =
                      variant.media.find(
                        (m) => m.type === "image" && m.position === 0,
                      )?.url ??
                      "https://placehold.co/600x600/eee/ccc.png?text=No+Image";
                    const isMenuOpen = dropdownItemId === item.id;

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
                            {/* Status Tag */}
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
                                {item.status.split("_").join(" ")}
                              </OverlayTagButton>
                            ) : (
                              item.status && (
                                <OverlayTag
                                  position="topLeft"
                                  className="capitalize"
                                >
                                  {item.status.split("_").join(" ")}
                                </OverlayTag>
                              )
                            )}

                            {/* Price Tag */}
                            <OverlayTag position="bottomLeft">
                              {formatCurrency(item.priceAtPurchase)} x
                              {item.quantity}
                            </OverlayTag>

                            {/* Ship */}
                            {item.status === "paid" && (
                              <OverlayButton
                                position="topRight"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShipModalProps(item);
                                }}
                                title="Ship Item"
                                className="font-semibold"
                              >
                                <MdLocalShipping />
                              </OverlayButton>
                            )}

                            {/* Edit Shipment */}
                            {item.status === "shipped" && (
                              <OverlayButton
                                position="topRight"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShipModalProps(item);
                                }}
                                title="Edit Shipment"
                                className="font-semibold"
                              >
                                <FaPen size={12} />
                              </OverlayButton>
                            )}

                            {item.status === "return_requested" && (
                              <OverlayDiv
                                position="topRight"
                                className="z-20" // Higher z-index so dropdown floats over other tags
                                title="Item Options"
                                // onMouseEnter={itemMenuPrefetch} // Desktop prefetch
                                onClick={(e) => {
                                  // itemMenuPrefetch(); // Mobile prefetch
                                  toggleMenu(e, item.id);
                                }}
                              >
                                <FaEllipsisV size={14} />
                                {isMenuOpen && (
                                  <div className="absolute top-8 right-0 z-50 flex min-w-36 flex-col rounded bg-gray-800 p-1 text-left text-xs font-semibold text-gray-400 transition-all">
                                    {/* Reject Return*/}
                                    {item.status === "return_requested" && (
                                      <button
                                        onClick={(e) =>
                                          handleRejectReturn(e, item)
                                        }
                                        className="flex w-full items-center gap-2 rounded p-2 hover:cursor-pointer hover:bg-gray-900 hover:text-blue-400"
                                      >
                                        <div className="item-center flex min-w-4 justify-center">
                                          <FaXmark
                                            size={16}
                                            className="text-gray-400"
                                          />
                                        </div>
                                        Reject Return
                                      </button>
                                    )}

                                    {/* Approve Return*/}
                                    {item.status === "return_requested" && (
                                      <button
                                        onClick={(e) =>
                                          handleApproveReturn(e, item)
                                        }
                                        className="flex w-full items-center gap-2 rounded p-2 hover:cursor-pointer hover:bg-gray-900 hover:text-blue-400"
                                      >
                                        <div className="item-center flex min-w-4 justify-center">
                                          <FaCheck className="text-gray-400" />
                                        </div>
                                        Approve Return
                                      </button>
                                    )}
                                  </div>
                                )}
                              </OverlayDiv>
                            )}

                            {/* Edit Reject Return */}
                            {/* Edit Approve Return */}

                            {/* Refund */}
                            {item.status === "returned" && (
                              <OverlayButton
                                position="topRight"
                                onClick={(e) => {
                                  handleRefund(e, item);
                                }}
                                title="Refund Item"
                                className="font-semibold"
                              >
                                <RiRefundFill />
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
    </>
  );
}
