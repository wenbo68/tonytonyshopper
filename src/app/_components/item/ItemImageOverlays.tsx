import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

export const overlayPositionClasses = {
  topLeft: "top-1 left-1",
  topRight: "top-1 right-1",
  bottomLeft: "bottom-1 left-1",
  bottomRight: "bottom-1 right-1",
};

// Common styles for the circular buttons (Edit, Delete, Add to Cart)
export const circularOverlayClass =
  "absolute z-10 flex h-6.5 w-6.5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-gray-300 backdrop-blur-sm transition-colors hover:bg-black/80 disabled:cursor-default";

interface OverlayProps {
  position?: keyof typeof overlayPositionClasses;
  children: ReactNode;
  className?: string;
  title?: string;
}

// For interactive buttons (onClick)
export function OverlayButton({
  position = "topLeft",
  children,
  className,
  ...props
}: OverlayProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        circularOverlayClass,
        overlayPositionClasses[position],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// For link buttons (href) - e.g., Edit Product
export function OverlayLink({
  position = "topLeft",
  href,
  children,
  className,
  title,
}: OverlayProps & { href: string }) {
  return (
    <Link
      href={href}
      className={clsx(
        circularOverlayClass,
        overlayPositionClasses[position],
        className,
      )}
      title={title}
    >
      {children}
    </Link>
  );
}

// For static tags (Price, Stock)
export function OverlayTag({
  position = "bottomLeft",
  children,
  className,
}: {
  position?: keyof typeof overlayPositionClasses;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "absolute z-10 rounded bg-black/60 px-1.5 py-1 text-xs font-semibold text-gray-300 backdrop-blur-sm",
        overlayPositionClasses[position],
        className,
      )}
    >
      {children}
    </div>
  );
}

// Container for multiple tags (e.g. Price + Stock side-by-side)
export function OverlayTagGroup({
  position = "bottomLeft",
  children,
  className,
}: {
  position?: keyof typeof overlayPositionClasses;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "absolute z-10 flex gap-1",
        overlayPositionClasses[position],
        className,
      )}
    >
      {children}
    </div>
  );
}
