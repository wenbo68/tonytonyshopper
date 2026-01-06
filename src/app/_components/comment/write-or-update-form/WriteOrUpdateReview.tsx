"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import StarRating from "../rating/StarRating";
import type { UpdateCommentInput } from "~/type";
// import toast from "react-hot-toast";
import { useProductContext } from "~/app/_contexts/ProductProvider";
import { customToast } from "~/app/_components/toast";
import { FaGripVertical, FaImage, FaTrash, FaVideo } from "react-icons/fa";
import { MultiUploader } from "../../MultiUploader";

interface MediaItem {
  key: string;
  url: string;
}

interface UpdateReviewFields {
  commentId: string;
  rating: number;
  text: string;
  // New media field for editing
  media: {
    key: string;
    url: string;
    type: "image" | "video";
    position: number;
  }[];
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  handleUpdate: ({ e, id, type, rating, text }: UpdateCommentInput) => void;
  isUpdatePending: boolean;
}

type WriteReviewProps = {
  updateInput?: UpdateReviewFields;
};

export default function WriteOrUpdateReview({ updateInput }: WriteReviewProps) {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const { productId } = useProductContext();

  const [rating, setRating] = useState(updateInput ? updateInput.rating : 0);
  const [text, setText] = useState(updateInput ? updateInput.text : "");
  const [error, setError] = useState("");

  // --- NEW: Media State ---
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<{
    type: "image" | "video";
    index: number;
  } | null>(null);

  // Initialize media state if editing
  useEffect(() => {
    if (updateInput?.media) {
      const sortedMedia = [...updateInput.media].sort(
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
    }
  }, []); // Run once on mount or if updateInput changes

  // --- NEW: Helper to prepare payload ---
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
      position: idx,
    }));
    return [...imagePayload, ...videoPayload];
  };

  // --- NEW: Check eligibility ---
  // Only run this check if the user is logged in AND not in "edit mode"
  const { data: canReview, isLoading: isCheckingEligibility } =
    api.comment.getCanReview.useQuery(
      { productId },
      { enabled: !!session && !updateInput },
    );

  const invalidateQueries = async (productId: string) => {
    await utils.comment.getCommentTree.invalidate();
    await utils.comment.getAverageRating.invalidate({ productId });
    // await utils.comment.getUserReviewForProduct.invalidate({ productId });
  };

  const addMutation = api.comment.add.useMutation({
    onMutate: () => {
      const toastId = customToast.loading("Adding...");
      return { toastId };
    },
    onSuccess: (data, input, context) => {
      void invalidateQueries(productId);
      customToast.success("Add succeeded.", context?.toastId);
    },
    onError: (err, input, context) => {
      void invalidateQueries(productId);
      customToast.error("Add failed. Please try again.", context?.toastId);
      console.error("WriteReview AddMutation onError:", err);
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please provide a rating.");
      return;
    }
    if (text.trim() === "") {
      setError("Please provide a valid comment.");
      return;
    }
    setError("");
    addMutation.mutate({
      productId,
      rating,
      text,
    });
  };

  const handleCancel = () => {
    updateInput?.setIsEditing(false);
    setError("");
  };

  // const handleSubmit = (e: FormEvent<Element>) =>
  //   updateInput
  //     ? updateInput.handleUpdate({
  //         e,
  //         id: updateInput.commentId,
  //         type: "review",
  //         rating,
  //         text,
  //       })
  //     : handleAdd(e);
  const handleSubmit = (e: FormEvent<Element>) => {
    if (updateInput) {
      updateInput.handleUpdate({
        e,
        id: updateInput.commentId,
        type: "review",
        rating,
        text,
        media: prepareMediaPayload(), // Pass media to update handler
      });
    } else {
      handleAdd(e as React.FormEvent);
    }
  };

  // --- NEW: Drag and Drop Handlers ---
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
  };

  if (!session)
    return (
      <p
        className={`bg-gray-900 ${updateInput ? `` : `p-5`} flex flex-col gap-4 rounded text-sm text-gray-400`}
      >
        Please login first to submit a review.
      </p>
    );

  if (!updateInput) {
    if (isCheckingEligibility) {
      return <div className="h-32 animate-pulse rounded bg-gray-900 p-5"></div>;
    }
    if (!canReview) {
      return (
        <div className="rounded bg-gray-900 p-5 text-sm text-gray-400">
          You can only review products you have purchased and received (Order
          Status: Shipped).
        </div>
      );
    }
  }

  if (!session)
    return (
      <p
        className={`bg-gray-900 ${
          updateInput ? `` : `p-5`
        } flex flex-col gap-4 rounded text-sm text-gray-400`}
      >
        Please login first to submit a review.
      </p>
    );

  // 2. If adding a new review (not editing), check eligibility
  if (!updateInput) {
    if (isCheckingEligibility) {
      return <div className="h-32 animate-pulse rounded bg-gray-900 p-5"></div>;
    }

    if (!canReview) {
      return (
        <div className="rounded bg-gray-900 p-5 text-sm text-gray-400">
          You can only review products you have purchased and received (Order
          Status: Shipped).
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className={`bg-gray-900 ${
          updateInput ? `` : `p-5`
        } flex flex-col gap-4 rounded text-sm text-gray-400`}
      >
        {/* rating */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex w-full flex-col gap-1">
            <span className="block font-medium">Rating</span>
            <div className="flex items-center rounded bg-gray-800 px-3 py-2.5">
              <StarRating rating={rating} setRating={setRating} />
            </div>
          </div>
        </div>

        {/* comment */}
        <div className="flex flex-col gap-1">
          <label htmlFor="comment" className="block font-medium text-gray-400">
            Comment
          </label>
          <textarea
            id="comment"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your experience..."
            className="scrollbar-hide w-full rounded bg-gray-800 px-3 py-2 outline-none"
          ></textarea>
        </div>

        {/* --- NEW: Media Upload Section --- */}
        <div className="flex flex-col gap-3">
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
        </div>

        {/* save/cancel for editing; submit button for adding*/}
        {updateInput ? (
          <div className="flex justify-end gap-4 text-gray-500">
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateInput.isUpdatePending}
              className="cursor-pointer hover:text-gray-400 disabled:cursor-default disabled:hover:text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateInput.isUpdatePending}
              className="cursor-pointer hover:text-gray-400 disabled:cursor-default disabled:hover:text-gray-500"
            >
              {updateInput.isUpdatePending ? "Saving" : "Save"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="min-w-36 cursor-pointer rounded bg-indigo-600 px-4 py-2 font-semibold text-gray-300 transition-all hover:bg-indigo-500 disabled:cursor-default disabled:bg-indigo-600"
            >
              {addMutation.isPending ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
