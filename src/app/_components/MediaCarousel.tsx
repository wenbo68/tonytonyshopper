"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Image from "next/image";
import { clsx } from "clsx";
import type { MediaType } from "~/server/db/schema";

export interface MediaItem {
  id?: string;
  type: MediaType;
  url: string;
  [key: string]: any;
}

interface MediaCarouselProps {
  mediaList: MediaItem[];
  initialIndex?: number;
  className?: string;
  renderItem?: (media: MediaItem, index: number) => ReactNode;
  children?: ReactNode; // Overlays
}

export function MediaCarousel({
  mediaList,
  initialIndex = 0,
  className,
  renderItem,
  children,
}: MediaCarouselProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(initialIndex);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to initial index on mount or when initialIndex changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        left: initialIndex * clientWidth,
        behavior: "instant",
      });
      setActiveMediaIndex(initialIndex);
    }
  }, [initialIndex]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -clientWidth : clientWidth,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const newIndex = Math.round(scrollLeft / clientWidth);
      setActiveMediaIndex(newIndex);
    }
  };

  if (mediaList.length === 0) return null;

  return (
    <div
      className={clsx(
        "group relative aspect-square w-full overflow-hidden rounded bg-black",
        className,
      )}
    >
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="scrollbar-hide flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {mediaList.map((media, idx) => (
          <div
            key={media.id || idx}
            className="flex h-full w-full shrink-0 snap-center items-center justify-center"
          >
            {renderItem ? (
              renderItem(media, idx)
            ) : media.type === "video" ? (
              <video
                src={media.url}
                controls
                className="h-full w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="relative h-full w-full">
                <Image
                  src={media.url}
                  alt="Media"
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {mediaList.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              scroll("left");
            }}
            className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-0"
          >
            <FaChevronLeft />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              scroll("right");
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <FaChevronRight />
          </button>
        </>
      )}

      {/* Indicators */}
      {mediaList.length > 1 && (
        <>
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-16 bg-linear-to-t from-black/70 to-transparent" />
          <div className="absolute right-0 bottom-2 left-0 z-20 flex justify-center gap-1.5 px-2">
            {mediaList.map((_, idx) => (
              <div
                key={idx}
                className={`h-[3px] w-full max-w-5.5 rounded-full shadow-sm transition-all duration-300 sm:max-w-6.5 ${
                  idx === activeMediaIndex
                    ? "bg-white opacity-100"
                    : "bg-white/50 opacity-60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Overlays */}
      {children}
    </div>
  );
}
