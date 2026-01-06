"use client";

import { useMediaModalStore } from "~/app/_hooks/useMediaModalStore";
import { MediaCarousel } from "../MediaCarousel";
import { handleOverlayClick } from "~/server/utils/modal";
import { useEffect } from "react";

export function MediaModal() {
  const { isOpen, close, mediaList, initialIndex } = useMediaModalStore();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="bg-opacity-80 fixed inset-0 z-100 flex items-center justify-center bg-black backdrop-blur-sm"
      onMouseDown={(e) => handleOverlayClick(e, close)}
    >
      <div
        className="relative w-full max-w-4xl p-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <MediaCarousel
          mediaList={mediaList}
          initialIndex={initialIndex}
          className="aspect-video w-full rounded-lg bg-black"
        />
      </div>
    </div>
  );
}
