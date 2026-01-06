import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import type { ReactNode } from "react";

interface ItemMediaProps {
  src: string;
  alt: string;
  href?: string;
  onClick?: () => void;
  children?: ReactNode; // For overlays (buttons, tags)
  className?: string;
  imageClassName?: string;
}

export function ItemImage({
  src,
  alt,
  href,
  onClick,
  children,
  className,
  imageClassName,
}: ItemMediaProps) {
  const imageContent = (
    <Image
      src={src}
      alt={alt}
      width={600}
      height={600}
      className={clsx(
        "aspect-square h-full w-full object-contain transition-transform duration-300 hover:scale-105",
        imageClassName,
      )}
    />
  );

  return (
    <div className={clsx("relative overflow-hidden rounded", className)}>
      {href ? (
        <Link onClick={onClick} href={href}>
          {imageContent}
        </Link>
      ) : (
        imageContent
      )}
      {children}
    </div>
  );
}
