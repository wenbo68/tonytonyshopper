"use client";

import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import StarRating from "../rating/StarRating";
import type { UpdateCommentInput } from "~/type";
import toast from "react-hot-toast";
import { useProductContext } from "~/app/_contexts/ProductProvider";

interface UpdateReviewFields {
  id: string;
  rating: number;
  text: string;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  handleUpdate: ({ e, id, type, rating, text }: UpdateCommentInput) => void;
  isUpdatePending: boolean;
}

type WriteReviewProps = {
  updateInput?: UpdateReviewFields;
};

export default function WriteReview({ updateInput }: WriteReviewProps) {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const { productId } = useProductContext();

  // --- NEW: Check eligibility ---
  // Only run this check if the user is logged in AND not in "edit mode"
  const { data: canReview, isLoading: isCheckingEligibility } =
    api.comment.getCanReview.useQuery(
      { productId },
      { enabled: !!session && !updateInput },
    );

  const [rating, setRating] = useState(updateInput ? updateInput.rating : 0);
  const [text, setText] = useState(updateInput ? updateInput.text : "");

  const [error, setError] = useState("");

  const addMutation = api.comment.add.useMutation({
    onError: (err, newReview, context) => {
      void utils.comment.getAverageRating.invalidate();
      void utils.comment.getCommentTree.invalidate();

      console.error("WriteReview addMutation onError:", err);
      setError("Failed to add review. Please try again.");

      toast.custom((t) => (
        <div className={`rounded bg-gray-700 px-4 py-2 text-sm text-gray-300`}>
          Submission failed. Please try again.
        </div>
      ));
    },
    onSuccess: () => {
      void utils.comment.getAverageRating.invalidate();
      void utils.comment.getCommentTree.invalidate();
      // Clear the form only on a successful submission.
      setRating(0);
      setText("");

      toast.custom((t) => (
        <div className={`rounded bg-gray-700 px-4 py-2 text-sm text-gray-300`}>
          Submission succeeded.
        </div>
      ));
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
        onSubmit={(e: FormEvent<Element>) =>
          updateInput
            ? updateInput.handleUpdate({
                e,
                id: updateInput.id,
                type: "review",
                rating,
                text,
              })
            : handleAdd(e)
        }
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
