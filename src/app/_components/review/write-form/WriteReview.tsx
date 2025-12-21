"use client";

import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { useSession } from "next-auth/react";
import { api, type RouterOutputs } from "~/trpc/react";
import StarRating from "../rating/StarRating";
import type { UpdateCommentInput } from "~/type";
import toast from "react-hot-toast";
// import { useProductContext } from "~/app/_contexts/ProductProvider";

interface UpdateReviewFields {
  commentId: string;
  rating: number;
  text: string;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  handleUpdate: ({ e, id, type, rating, text }: UpdateCommentInput) => void;
  isUpdatePending: boolean;
}

type WriteReviewProps = {
  productId: string;
  productVariantId?: string;
  existingReview?: RouterOutputs["comment"]["getUserReviewForProduct"]; // New prop
  updateInput?: UpdateReviewFields; // Keep for compatibility with comment section
  onSuccess?: () => void;
};

export default function WriteReview({
  productId,
  productVariantId,
  existingReview,
  updateInput,
  onSuccess,
}: WriteReviewProps) {
  const { data: session } = useSession();
  const utils = api.useUtils();

  // Initialize state with existing review data if available
  const [rating, setRating] = useState(
    updateInput ? updateInput.rating : (existingReview?.rating ?? 0),
  );
  const [text, setText] = useState(
    updateInput ? updateInput.text : (existingReview?.text ?? ""),
  );
  const [error, setError] = useState("");

  // Common invalidation logic
  const invalidateQueries = () => {
    void utils.comment.getAverageRating.invalidate();
    void utils.comment.getCommentTree.invalidate();
    void utils.comment.getUserReviewForProduct.invalidate({ productId });
  };

  const addMutation = api.comment.add.useMutation({
    onError: (err, newReview, context) => {
      // void utils.comment.getAverageRating.invalidate();
      // void utils.comment.getCommentTree.invalidate();
      invalidateQueries();

      console.error("WriteReview addMutation onError:", err);
      setError("Failed to add review. Please try again.");

      toast.custom((t) => (
        <div className={`rounded bg-gray-700 px-4 py-2 text-sm text-gray-300`}>
          Submission failed. Please try again.
        </div>
      ));
    },
    onSuccess: (data, variables) => {
      // void utils.comment.getAverageRating.invalidate();
      // void utils.comment.getCommentTree.invalidate();
      invalidateQueries();

      // // Clear the form only on a successful submission.
      // setRating(0);
      // setText("");

      toast.custom((t) => (
        <div className={`rounded bg-gray-700 px-4 py-2 text-sm text-gray-300`}>
          Submission succeeded.
        </div>
      ));
      // // Only trigger closure if this specific product's review finished
      // if (variables.productId === productId) {
      //   onSuccess?.();
      // }
    },
  });

  const updateMutation = api.comment.update.useMutation({
    onSuccess: (data, variables) => {
      invalidateQueries();
      toast.custom((t) => (
        <div className={`rounded bg-gray-700 px-4 py-2 text-sm text-gray-300`}>
          Update succeeded.
        </div>
      ));
      // // Only trigger closure if this specific review ID finished
      // if (variables.id === existingReview?.id) {
      //   onSuccess?.();
      // }
    },
    onError: () => setError("Failed to update review."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return setError("Please provide a rating.");
    if (!text.trim()) return setError("Please provide a comment.");

    setError("");

    if (existingReview) {
      updateMutation.mutate({ id: existingReview.id, rating, text });
    } else {
      addMutation.mutate({
        productId,
        productVariantId: productVariantId!,
        rating,
        text,
      });
    }
  };

  // Decouple pending state from other items
  const isPending =
    (addMutation.isPending && addMutation.variables?.productId === productId) ||
    (updateMutation.isPending &&
      updateMutation.variables?.id === existingReview?.id);

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

  return (
    <div className="flex w-full flex-col gap-2">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <form
        onSubmit={(e: FormEvent<Element>) => {
          if (updateInput) {
            // Logic for inline editing in comment section
            updateInput.handleUpdate({
              e,
              id: updateInput.commentId,
              type: "review",
              rating,
              text,
            });
          } else {
            // Logic for the ReviewModal (Add/Edit mode)
            handleSubmit(e); // Added the (e) to actually execute the function
          }
        }}
        className={`bg-gray-900 ${
          updateInput ? `` : `p-4`
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

        {/* save/cancel for editing; submit button for adding*/}
        {updateInput ? (
          <div className="flex justify-end gap-4 text-gray-500">
            <button
              type="button"
              onClick={() => {
                updateInput.setIsEditing(false);
                setError("");
              }}
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
              disabled={isPending}
              className="min-w-36 cursor-pointer rounded bg-indigo-600 px-4 py-2 font-semibold text-gray-300 transition-all hover:bg-indigo-500 disabled:cursor-default disabled:bg-indigo-600"
            >
              {isPending ? "Saving..." : existingReview ? "Update" : "Submit"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
