import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ItemImage } from "./ItemImage";

interface ItemCardProps {
  image: {
    src: string;
    alt: string;
    href?: string;
  };
  overlays?: ReactNode; // Elements to place on top of the image (buttons, tags)
  children: ReactNode; // The caption/content below the image
  className?: string; // Optional class for the outer wrapper
}

export function ItemCard({
  image,
  overlays,
  children,
  className,
}: ItemCardProps) {
  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <ItemImage src={image.src} alt={image.alt} href={image.href}>
        {overlays}
      </ItemImage>
      <div className="flex flex-col gap-0 px-1">{children}</div>
    </div>
  );
}
