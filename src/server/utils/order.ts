import { orderItemStatusPriority } from "~/const";

export const getOrderItemStatusPriority = (status: string | null) => {
  if (!status) return 999; // Handle nulls (put them last)
  return (
    orderItemStatusPriority[status as keyof typeof orderItemStatusPriority] ??
    999
  );
};
