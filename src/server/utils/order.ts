import { orderItemStatusConst } from "~/const";
import { orderItems, type OrderItemStatus } from "../db/schema";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { OrderItem } from "~/type";
import { TRPCError } from "@trpc/server";
import { and, eq, type ExtractTablesWithRelations } from "drizzle-orm";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db } from "../db";

// export const getOrderItemStatusPriority = (status: string | null) => {
//   if (!status) return 999; // Handle nulls (put them last)
//   return (
//     orderItemStatusPriorityMap[
//       status as keyof typeof orderItemStatusPriorityMap
//     ] ?? 999
//   );
// };

export const getOrderItemStatusPriority = (status: OrderItemStatus | null) => {
  if (!status) return Number.MAX_SAFE_INTEGER;

  const index = orderItemStatusConst.indexOf(status);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

export const fetchOrderItem = async (
  tx: PgTransaction<
    PostgresJsQueryResultHKT,
    typeof import("/home/wenboliu68/projects/tonytonyshopper/src/server/db/schema"),
    ExtractTablesWithRelations<
      typeof import("/home/wenboliu68/projects/tonytonyshopper/src/server/db/schema")
    >
  >,
  currentUserId: string | undefined,
  orderItemId: string,
  requiredStatus: OrderItemStatus,
  quantity: number,
) => {
  //1. find/check order item
  const item = await tx.query.orderItems.findFirst({
    where: and(eq(orderItems.id, orderItemId)),
    with: {
      order: true,
    },
  });

  if (!item) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Item not found.",
    });
  }

  if (item.status !== requiredStatus) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Item status: ${item.status}. Must be: ${requiredStatus}`,
    });
  }

  if (currentUserId && item.order.userId !== currentUserId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not authorized.",
    });
  }

  if (quantity > item.quantity) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Quantity too high.",
    });
  }
  return item;
};

export const updateOrderItem = async (
  tx: PgTransaction<
    PostgresJsQueryResultHKT,
    typeof import("/home/wenboliu68/projects/tonytonyshopper/src/server/db/schema"),
    ExtractTablesWithRelations<
      typeof import("/home/wenboliu68/projects/tonytonyshopper/src/server/db/schema")
    >
  >,
  currentUserId: string | undefined,
  orderItem: string | OrderItem,
  requiredStatus: OrderItemStatus,
  targetStatus: OrderItemStatus,
  quantity: number,
  update: Partial<OrderItem>,
) => {
  let item: OrderItem | null = null;
  if (typeof orderItem === "string") {
    item = await fetchOrderItem(
      tx,
      currentUserId,
      orderItem,
      requiredStatus,
      quantity,
    );
  } else {
    item = orderItem;
  }

  // 2. full vs partial update
  if (quantity === item.quantity) {
    await tx
      .update(orderItems)
      .set({
        status: targetStatus,
        ...update,
      })
      .where(eq(orderItems.id, item.id));
  } else {
    await tx
      .update(orderItems)
      .set({
        quantity: item.quantity - quantity,
      })
      .where(eq(orderItems.id, item.id));
    await tx.insert(orderItems).values({
      orderId: item.orderId,
      productVariantId: item.productVariantId,
      quantity: quantity,
      priceAtPurchase: item.priceAtPurchase,
      status: targetStatus,
      ...update,
    });
  }
};
