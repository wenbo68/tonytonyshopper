import clsx from "clsx";
import type { ReactNode } from "react";

export const itemGridClassName =
  "grid grid-cols-2 gap-2 sm:gap-2 md:gap-2 lg:gap-2 xl:gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

export function ItemGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx(itemGridClassName, className)}>{children}</div>;
}
