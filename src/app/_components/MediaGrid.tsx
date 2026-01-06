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
  gridClassName = "grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5",
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
    <div className="flex flex-col gap-2 rounded bg-gray-800/50 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300">
          {title ? (
            title
          ) : (
            <>
              {mediaType === "image" ? <FaImage /> : <FaVideo />}
              {mediaType === "image" ? " Images" : " Videos"}
            </>
          )}
        </h3>
        <span className="text-[10px] text-gray-500">
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
            className="relative flex aspect-square cursor-grab flex-col items-center justify-center overflow-hidden rounded border border-gray-700 bg-black active:cursor-grabbing"
          >
            {mediaType === "video" ? (
              <>
                <video
                  src={item.url}
                  className="h-full w-full object-contain"
                  // No controls here
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <FaGripVertical className="text-white drop-shadow-md" />
            </div>

            {/* Delete Button */}
            <div className="absolute top-1 right-1">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="rounded-full bg-red-600 p-1 text-white hover:bg-red-500"
              >
                <FaTrash size={10} />
              </button>
            </div>
          </div>
        ))}

        {/* Uploader */}
        {items.length < maxItems && (
          <div className="col-span-1 h-full">
            <MultiUploader
              label="+"
              uploadThingRoute={uploadThingRoute}
              availability={maxItems - items.length}
              onUploadSuccess={handleUploadSuccess}
              className="h-full min-h-20" // Ensure it has height
            />
          </div>
        )}
      </div>
    </div>
  );
}
