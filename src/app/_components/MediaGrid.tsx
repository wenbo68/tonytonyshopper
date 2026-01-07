"use client";

import Image from "next/image";
import { useState } from "react";
import {
  FaGripVertical,
  FaImage,
  FaPlay,
  FaTrash,
  FaVideo,
} from "react-icons/fa";
import { MultiUploader } from "./MultiUploader";
import type { MediaType } from "~/server/db/schema";
import type { UploadThingRoute } from "~/type";

export type MediaItem = {
  key: string;
  url: string;
};

type MediaGridProps = {
  items: MediaItem[];
  onChange: (newItems: MediaItem[]) => void;
  mediaType: MediaType;
  maxItems: number;
  uploadThingRoute: UploadThingRoute; // Using string to allow various endpoints
  title?: React.ReactNode;
  gridClassName?: string;
};

export function MediaGrid({
  items,
  onChange,
  mediaType,
  maxItems,
  uploadThingRoute,
  title,
  gridClassName = "grid grid-cols-2 gap-2 sm:grid-cols-4",
}: MediaGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // --- Drag & Drop Handlers ---
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Optional: Set drag image or data if needed
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const onDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    if (draggedIndex === targetIndex) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(draggedIndex, 1);
    if (movedItem) {
      newItems.splice(targetIndex, 0, movedItem);
    }
    onChange(newItems);
    setDraggedIndex(null);
  };

  // --- Action Handlers ---
  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleUploadSuccess = (newFiles: { key: string; url: string }[]) => {
    const availableSlots = maxItems - items.length;
    if (newFiles.length > availableSlots) {
      alert(`You can only add ${availableSlots} more ${mediaType}(s).`);
      // Optionally add only the ones that fit, or just return
      return;
    }
    onChange([...items, ...newFiles]);
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {title ? title : mediaType === "image" ? "Images:" : "Videos:"}
        </h3>
        <span className="">
          {items.length}/{maxItems}
        </span>
      </div>

      {/* Grid */}
      <div className={gridClassName}>
        {items.map((item, index) => (
          <div
            key={item.key}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, index)}
            className="relative flex aspect-square cursor-grab flex-col items-center justify-center overflow-hidden rounded border border-gray-800 bg-black active:cursor-grabbing"
          >
            {mediaType === "video" ? (
              <>
                <video
                  src={item.url}
                  className="h-full w-full object-contain"
                  // No controls here
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <FaPlay className="text-gray-300" />
                </div>
              </>
            ) : (
              <Image
                src={item.url}
                alt="Review media"
                fill
                className="object-contain"
              />
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
              <FaGripVertical className="text-gray-300" />
            </div>

            {/* Delete Button */}
            <div className="absolute top-1.5 right-1.5">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="flex cursor-pointer items-center justify-center rounded-full bg-red-600/50 p-1.5 text-gray-300 hover:bg-red-600/80"
              >
                <FaTrash size={10} />
              </button>
            </div>
          </div>
        ))}

        {/* Uploader */}
        {items.length < maxItems && (
          // <div className="">
          <MultiUploader
            label="+"
            uploadThingRoute={uploadThingRoute}
            availability={maxItems - items.length}
            onUploadSuccess={handleUploadSuccess}
          />
          // </div>
        )}
      </div>
    </div>
  );
}
