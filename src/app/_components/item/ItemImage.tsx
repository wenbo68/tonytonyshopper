import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import type { ReactNode } from "react";

interface ItemImageProps {
  src: string;
  alt: string;
  href?: string;
  children?: ReactNode; // For overlays (buttons, tags)
  className?: string;
  imageClassName?: string;
}

export function ItemImage({
  src,
  alt,
  href,
  children,
  className,
  imageClassName,
}: ItemImageProps) {
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
