import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { handleOverlayClick } from "~/server/utils/modal";
import StarRating from "../comment/rating/StarRating";
import { customToast } from "~/app/_components/toast";
import { MultiUploader } from "~/app/_components/MultiUploader";
import { FaTrash, FaGripVertical, FaVideo, FaImage } from "react-icons/fa";

type ReviewModalProps = {
  itemIds: { productId: string; productVariantId: string } | null;
  isOpen: boolean;
  onClose: () => void;
};

type MediaItem = {
  key: string;
  url: string;
};

export default function ReviewModal({
  itemIds,
  isOpen,
  onClose,
}: ReviewModalProps) {
  const utils = api.useUtils();

  const { data: existingReview, isFetching: isFetchingExistingReview } =
    api.comment.getUserReviewForProduct.useQuery(
      { productId: itemIds?.productId ?? "" },
      { enabled: !!itemIds?.productId && isOpen },
    );

  // Initialize state
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [error, setError] = useState("");

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{
    type: "image" | "video";
    index: number;
  } | null>(null);

  // Sync state when existingReview data arrives
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating ?? 0);
      setText(existingReview.text);

      // --- ADD THIS LOGIC TO LOAD MEDIA FROM DB ---
      const sortedMedia = [...(existingReview.media ?? [])].sort(
        (a, b) => a.position - b.position,
      );

      setImages(
        sortedMedia
          .filter((m) => m.type === "image")
          .map((m) => ({ key: m.key, url: m.url })),
      );

      setVideos(
        sortedMedia
          .filter((m) => m.type === "video")
          .map((m) => ({ key: m.key, url: m.url })),
      );
      // --------------------------------------------
    } else {
      setRating(0);
      setText("");
      setImages([]);
      setVideos([]);
    }
  }, [existingReview]);

  // prevent scrolling main page when modal is open
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

  const invalidateQueries = async (productId: string) => {
    await utils.comment.getUserReviewForProduct.invalidate({ productId });
  };

  const prepareMediaPayload = () => {
    const imagePayload = images.map((img, idx) => ({
      key: img.key,
      url: img.url,
      type: "image" as const,
      position: idx,
    }));
    const videoPayload = videos.map((vid, idx) => ({
      key: vid.key,
      url: vid.url,
      type: "video" as const,
      position: idx, // Videos have their own position counter (starts at 0)
    }));
    return [...imagePayload, ...videoPayload];
  };

  const addMutation = api.comment.add.useMutation({
    onMutate: () => {
      const toastId = customToast.loading("Adding...");
      return { toastId };
    },
    onSuccess: (data, input, context) => {
      void invalidateQueries(input.productId);
      customToast.success("Add succeeded.", context?.toastId);
      onClose(); // Close modal on success
    },
    onError: (err, input, context) => {
      setRating(input.rating ?? 0);
      setText(input.text);
      console.error("ReviewModal addMutation onError:", err);
      customToast.error("Add failed. Please try again.", context?.toastId);
    },
  });

  const updateMutation = api.comment.update.useMutation({
    onMutate: () => {
      const toastId = customToast.loading("Updating...");
      return { toastId, productId: itemIds?.productId };
    },
    onSuccess: (data, input, context) => {
      if (context.productId) void invalidateQueries(context.productId);
      customToast.success("Update succeeded.", context?.toastId);
      onClose();
    },
    onError: (err, input, context) => {
      setRating(input.rating ?? 0);
      setText(input.text ?? "");
      console.error("ReviewModal updateMutation onError:", err);
      customToast.error("Update failed. Please try again.", context?.toastId);
    },
  });

  const deleteMutation = api.comment.delete.useMutation({
    onMutate: () => {
      const toastId = customToast.loading("Deleting...");
      return { toastId, productId: itemIds?.productId };
    },
    onSuccess: (data, input, context) => {
      if (context.productId) void invalidateQueries(context.productId);
      customToast.success("Delete succeeded.", context?.toastId);
      onClose();
    },
    onError: (err, input, context) => {
      console.error("ReviewModal deleteMutation onError:", err);
      customToast.error("Delete failed. Please try again.", context?.toastId);
    },
  });

  // --- Drag and Drop Logic ---
  const onDragStart = (
    e: React.DragEvent,
    type: "image" | "video",
    index: number,
  ) => {
    setDraggedItem({ type, index });
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (
    e: React.DragEvent,
    targetType: "image" | "video",
    targetIndex: number,
  ) => {
    e.preventDefault();
    if (!draggedItem) return;
    const { type: sourceType, index: sourceIndex } = draggedItem;

    // Only allow dropping within same type
    if (sourceType !== targetType) return;
    if (sourceIndex === targetIndex) return;

    if (sourceType === "image") {
      setImages((prev) => {
        const list = [...prev];
        const [moved] = list.splice(sourceIndex, 1);
        if (moved) list.splice(targetIndex, 0, moved);
        return list;
      });
    } else {
      setVideos((prev) => {
        const list = [...prev];
        const [moved] = list.splice(sourceIndex, 1);
        if (moved) list.splice(targetIndex, 0, moved);
        return list;
      });
    }
    setDraggedItem(null);
  };

  // --- Media Handlers ---
  const addImages = (newFiles: { key: string; url: string }[]) => {
    setImages((prev) => {
      if (prev.length + newFiles.length > 4) {
        alert("Max 4 images allowed.");
        return prev;
      }
      return [...prev, ...newFiles];
    });
  };

  const addVideo = (newFiles: { key: string; url: string }[]) => {
    setVideos((prev) => {
      if (prev.length + newFiles.length > 1) {
        alert("Max 1 video allowed.");
        return prev;
      }
      return [...prev, ...newFiles];
    });
  };

  const removeMedia = (index: number, type: "image" | "video") => {
    if (type === "image") {
      setImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setVideos((prev) => prev.filter((_, i) => i !== index));
    }
    // Optionally trigger server-side delete for the file here
  };

  if (!isOpen || !itemIds) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return setError("Please provide a rating.");
    if (!text.trim()) return setError("Please provide a comment.");

    setError("");
    const mediaPayload = prepareMediaPayload();

    if (existingReview) {
      updateMutation.mutate({
        id: existingReview.id,
        rating,
        text,
        media: mediaPayload,
      });
    } else {
      addMutation.mutate({
        productId: itemIds.productId,
        productVariantId: itemIds.productVariantId,
        rating,
        text,
        media: mediaPayload,
      });
    }
  };

  const isPending =
    (addMutation.isPending &&
      addMutation.variables?.productId === itemIds.productId) ||
    (updateMutation.isPending &&
      updateMutation.variables?.id === existingReview?.id);

  const isDeleting =
    deleteMutation.isPending &&
    deleteMutation.variables?.id === existingReview?.id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => handleOverlayClick(e, onClose)}
    >
      <div
        className="scrollbar-thin max-h-[90vh] w-full max-w-[90vw] overflow-y-auto rounded-lg bg-gray-900 sm:max-w-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {isFetchingExistingReview ? (
          <div className="p-6 text-center text-gray-500">
            <p className="animate-pulse">Loading review...</p>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2 p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-200">
              {existingReview ? "Edit Review" : "Write a Review"}
            </h2>
            {error && <p className="text-sm text-red-400">{error}</p>}

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 text-sm text-gray-400"
            >
              {/* Rating */}
              <div className="flex flex-col gap-1">
                <span className="block font-medium text-gray-300">Rating</span>
                <div className="flex w-fit items-center rounded bg-gray-800 px-3 py-2">
                  <StarRating rating={rating} setRating={setRating} />
                </div>
              </div>

              {/* Comment */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="comment"
                  className="block font-medium text-gray-300"
                >
                  Comment
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share your experience..."
                  className="scrollbar-hide w-full rounded bg-gray-800 px-3 py-2 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>

              {/* Images */}
              <div className="flex flex-col gap-2 rounded bg-gray-800/50 p-3">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                    <FaImage /> Images ({images.length}/4)
                  </h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, idx) => (
                    <div
                      key={img.key}
                      draggable
                      onDragStart={(e) => onDragStart(e, "image", idx)}
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, "image", idx)}
                      className="relative flex aspect-square cursor-grab flex-col items-center justify-center overflow-hidden rounded border border-gray-600 bg-gray-800 active:cursor-grabbing"
                    >
                      <img
                        src={img.url}
                        alt="review"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                        <FaGripVertical className="text-white drop-shadow-md" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia(idx, "image")}
                        className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-500"
                      >
                        <FaTrash size={8} />
                      </button>
                    </div>
                  ))}
                  {images.length < 4 && (
                    <div className="col-span-1">
                      <MultiUploader
                        label="+"
                        uploadThingRoute="commentImageUploader"
                        availability={4 - images.length}
                        onUploadSuccess={addImages}
                        className="h-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Video */}
              <div className="flex flex-col gap-2 rounded bg-gray-800/50 p-3">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                    <FaVideo /> Video ({videos.length}/1)
                  </h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {videos.map((vid, idx) => (
                    <div
                      key={vid.key}
                      draggable
                      onDragStart={(e) => onDragStart(e, "video", idx)}
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, "video", idx)}
                      className="relative flex aspect-square cursor-grab flex-col items-center justify-center overflow-hidden rounded border border-gray-600 bg-gray-800 active:cursor-grabbing"
                    >
                      <div className="flex h-full w-full items-center justify-center bg-black">
                        <FaVideo className="text-xl text-gray-500" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                        <FaGripVertical className="text-white drop-shadow-md" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia(idx, "video")}
                        className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-500"
                      >
                        <FaTrash size={8} />
                      </button>
                    </div>
                  ))}
                  {videos.length < 1 && (
                    <div className="col-span-1">
                      <MultiUploader
                        label="+"
                        uploadThingRoute="commentVideoUploader"
                        availability={1 - videos.length}
                        onUploadSuccess={addVideo}
                        className="h-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-2 flex items-center justify-end gap-3">
                {existingReview && (
                  <button
                    type="button"
                    disabled={isPending || isDeleting}
                    onClick={() => {
                      if (window.confirm("Delete this review?")) {
                        deleteMutation.mutate({ id: existingReview.id });
                      }
                    }}
                    className="cursor-pointer text-sm font-semibold text-red-400 hover:text-red-300 disabled:text-gray-600"
                  >
                    {isDeleting ? "Deleting..." : "Delete Review"}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isPending || isDeleting}
                  className="min-w-[100px] rounded bg-indigo-600 px-4 py-2 font-semibold text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-700"
                >
                  {isPending
                    ? "Saving..."
                    : existingReview
                      ? "Update"
                      : "Submit"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
