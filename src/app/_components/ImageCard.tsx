// src/app/_components/ui/ImageCard.tsx
import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import type { ReactNode } from "react";

// --- 1. The Grid Layout ---
// Replaces the repeated grid classes in Products, Cart, and Orders
export function ProductGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "grid grid-cols-2 gap-3 space-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

// --- 2. The Image Container ---
// Handles aspect ratio, rounded corners, and the Next.js Image component
interface ImageCardProps {
  src: string;
  alt: string;
  href?: string;
  children?: ReactNode; // For overlays (buttons, tags)
  className?: string;
  imageClassName?: string;
}

export function ImageCard({
  src,
  alt,
  href,
  children,
  className,
  imageClassName,
}: ImageCardProps) {
  const imageContent = (
    <Image
      src={src}
      alt={alt}
      width={600}
      height={600}
      className={clsx(
        "aspect-square h-full w-full object-cover transition-transform duration-300 hover:scale-105",
        imageClassName,
      )}
    />
  );

  return (
    <div className={clsx("relative overflow-hidden rounded", className)}>
      {href ? <Link href={href}>{imageContent}</Link> : imageContent}
      {children}
    </div>
  );
}

// --- 3. Overlay Components (Buttons & Tags) ---

const positionClasses = {
  topLeft: "top-2 left-2",
  topRight: "top-2 right-2",
  bottomLeft: "bottom-2 left-2",
  bottomRight: "bottom-2 right-2",
};

// Common styles for the circular buttons (Edit, Delete, Add to Cart)
export const overlayButtonClass =
  "absolute z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/60 text-gray-100 backdrop-blur-sm transition-colors hover:bg-black/80 disabled:cursor-wait disabled:opacity-50";

interface OverlayProps {
  position?: keyof typeof positionClasses;
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
      className={clsx(overlayButtonClass, positionClasses[position], className)}
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
      className={clsx(overlayButtonClass, positionClasses[position], className)}
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
  position?: keyof typeof positionClasses;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "absolute z-10 rounded bg-black/60 px-2 py-1 text-xs font-bold text-gray-100 backdrop-blur-sm",
        positionClasses[position],
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
  position?: keyof typeof positionClasses;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "absolute z-10 flex gap-2",
        positionClasses[position],
        className,
      )}
    >
      {children}
    </div>
  );
}
