import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { handleOverlayClick } from "~/server/utils/modal";
import StarRating from "../comment/rating/StarRating";
import { customToast } from "~/app/_components/toast";
import { MediaGrid, type MediaItem } from "../MediaGrid";

type ReviewModalProps = {
  itemIds: { productId: string; productVariantId: string } | null;
  isOpen: boolean;
  onClose: () => void;
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

  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating ?? 0);
      setText(existingReview.text);

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
    } else {
      setRating(0);
      setText("");
      setImages([]);
      setVideos([]);
    }
  }, [existingReview]);

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
      position: idx,
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
      onClose();
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
      onMouseDown={(e) => handleOverlayClick(e, onClose)}
    >
      <div
        className="scrollbar-hide max-h-[90vh] w-full max-w-[90vw] overflow-y-auto rounded bg-gray-900 sm:max-w-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {isFetchingExistingReview ? (
          <div className="p-6 text-center text-gray-500">
            <p className="animate-pulse">Loading review...</p>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2 p-4">
            {error && <p className="text-sm text-red-400">{error}</p>}

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 text-sm text-gray-400"
            >
              <div className="flex flex-col gap-1">
                <span className="block font-medium text-gray-300">Rating</span>
                <div className="flex w-full items-center rounded bg-gray-800 px-3 py-2">
                  <StarRating rating={rating} setRating={setRating} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="comment"
                  className="block font-medium text-gray-300"
                >
                  Comment
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share your experience..."
                  className="scrollbar-hide w-full rounded bg-gray-800 px-3 py-2 outline-none"
                ></textarea>
              </div>

              {/* Using MediaGrid */}
              <div className="flex flex-col gap-3">
                <MediaGrid
                  mediaType="image"
                  maxItems={4}
                  items={images}
                  onChange={setImages}
                  uploadThingRoute="commentImageUploader"
                  gridClassName="grid grid-cols-4 gap-2"
                />

                <MediaGrid
                  mediaType="video"
                  maxItems={1}
                  items={videos}
                  onChange={setVideos}
                  uploadThingRoute="commentVideoUploader"
                  gridClassName="grid grid-cols-4 gap-2"
                />
              </div>

              <div className="flex items-center gap-3">
                {existingReview && (
                  <button
                    type="button"
                    disabled={isPending || isDeleting}
                    onClick={() => {
                      if (window.confirm("Delete this review?")) {
                        deleteMutation.mutate({ id: existingReview.id });
                      }
                    }}
                    className="w-full min-w-[100px] rounded bg-red-600/40 px-4 py-2 font-semibold text-white transition-all hover:cursor-pointer hover:bg-red-600/30 disabled:cursor-default disabled:bg-gray-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete Review"}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isPending || isDeleting}
                  className="w-full min-w-[100px] rounded bg-indigo-600 px-4 py-2 font-semibold text-white transition-all hover:cursor-pointer hover:bg-indigo-700 disabled:cursor-default disabled:bg-gray-700"
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
