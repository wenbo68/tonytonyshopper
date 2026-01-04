// src/app/_components/review/write-form/AddReviewModal.tsx
"use client";

import { api } from "~/trpc/react";
import toast from "react-hot-toast";
import ReviewForm from "../comment/write-or-update-form/ReviewForm";

interface AddReviewModalProps {
  productId: string;
  productVariantId: string;
  variantName: string; // e.g., "Blue / Large"
  isOpen: boolean;
  closeModal: () => void;
}

export default function AddReviewModal({
  productId,
  productVariantId,
  variantName,
  isOpen,
  closeModal,
}: AddReviewModalProps) {
  const utils = api.useUtils();

  const addMutation = api.comment.add.useMutation({
    onSuccess: () => {
      toast.success("Review submitted!");
      // Invalidate queries so the new review shows up elsewhere if needed
      void utils.comment.getAverageRating.invalidate();
      closeModal();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to submit review.");
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-lg bg-gray-900 p-6">
        <h2 className="mb-1 text-xl font-bold text-white">Write a Review</h2>
        <p className="mb-6 text-sm text-gray-400">Reviewing: {variantName}</p>

        <ReviewForm
          isSubmitting={addMutation.isPending}
          onCancel={closeModal}
          submitLabel="Submit Review"
          onSubmit={({ rating, text }) => {
            addMutation.mutate({
              productId,
              productVariantId, // Pass the variant ID here
              rating,
              text,
            });
          }}
        />
      </div>
    </div>
  );
}
