import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { handleOverlayClick } from "~/server/utils/modal";
import StarRating from "../review/rating/StarRating";
import { customToast } from "~/server/utils/toast";

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

  // Initialize state with existing review data if available
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [text, setText] = useState(existingReview?.text ?? "");
  const [error, setError] = useState("");

  // Sync state when existingReview data arrives
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating ?? 0);
      setText(existingReview.text);
    } else {
      setRating(0);
      setText("");
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
    await utils.comment.getUserReviewForProduct.invalidate({
      productId,
    });
    // await utils.product.getById.invalidate({ id: productId });
  };

  const addMutation = api.comment.add.useMutation({
    onMutate: () => {
      const toastId = customToast.loading("Adding...");
      return { toastId };
    },
    onSuccess: (data, input, context) => {
      void invalidateQueries(input.productId);
      customToast.success("Add succeeded.", context?.toastId);
    },
    onError: (err, input, context) => {
      void invalidateQueries(input.productId);

      setRating(input.rating ?? 0);
      setText(input.text);

      console.error("ReviewModal addMutation onError:", err);
      // setError("Add review. Please try again.");

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
    },
    onError: (err, input, context) => {
      if (context?.productId) void invalidateQueries(context.productId);

      setRating(input.rating ?? 0);
      setText(input.text ?? "");

      console.error("ReviewModal updateMutation onError:", err);
      // setError("Update failed. Please try again.");

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
    },
    onError: (err, input, context) => {
      if (context?.productId) void invalidateQueries(context.productId);

      console.error("ReviewModal deleteMutation onError:", err);
      // setError("Failed to delete review. Please try again.");

      customToast.error("Delete failed. Please try again.", context?.toastId);
    },
  });

  if (!isOpen || !itemIds) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return setError("Please provide a rating.");
    if (!text.trim()) return setError("Please provide a comment.");

    setError("");

    if (existingReview) {
      updateMutation.mutate({ id: existingReview.id, rating, text });
    } else {
      addMutation.mutate({
        productId: itemIds.productId,
        productVariantId: itemIds.productVariantId,
        rating,
        text,
      });
    }
  };

  // Decouple pending state from other items
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
        className="max-h-[90vh] w-full max-w-[90vw] sm:max-w-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {isFetchingExistingReview ? (
          <div className="rounded bg-gray-900 p-6 text-center text-gray-500">
            <p className="animate-pulse">Loading review...</p>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2">
            {error && <p className="text-sm text-red-400">{error}</p>}

            <form
              onSubmit={handleSubmit}
              className={`flex flex-col gap-4 rounded bg-gray-900 p-4 text-sm text-gray-400`}
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
                <label
                  htmlFor="comment"
                  className="block font-medium text-gray-400"
                >
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

              <div className="flex items-center justify-end gap-2">
                {/* delete button */}
                {existingReview && (
                  <button
                    type="button"
                    disabled={isPending || isDeleting}
                    onClick={() => {
                      if (window.confirm("Delete this review?")) {
                        deleteMutation.mutate({ id: existingReview.id });
                      }
                    }}
                    className="w-full cursor-pointer rounded bg-red-600/20 px-4 py-2 font-semibold text-red-400 transition-all hover:bg-red-600/30 disabled:cursor-default disabled:bg-red-600/20 sm:min-w-30"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                )}
                {/* submit/update button */}
                <button
                  type="submit"
                  disabled={isPending || isDeleting}
                  className="w-full cursor-pointer rounded bg-indigo-600 px-4 py-2 font-semibold text-gray-300 transition-all hover:bg-indigo-500 disabled:cursor-default disabled:bg-indigo-600 sm:min-w-30"
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
