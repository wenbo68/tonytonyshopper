// src/app/_components/review/write-form/WriteReview.tsx
"use client";

import { type Dispatch, type SetStateAction } from "react";
import ReviewForm from "./ReviewForm";
import type { UpdateCommentInput } from "~/type";

interface UpdateReviewFields {
  id: string;
  rating: number;
  text: string;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  handleUpdate: ({ e, id, type, rating, text }: UpdateCommentInput) => void;
  isUpdatePending: boolean;
}

// Now purely an Edit Wrapper
export default function WriteReview({
  updateInput,
}: {
  updateInput: UpdateReviewFields;
}) {
  // We adapter the ReviewForm's simple onSubmit to the complex handleUpdate used by the parent
  const handleEditSubmit = (data: { rating: number; text: string }) => {
    // Construct a fake event if your handleUpdate strictly needs it,
    // or refactor handleUpdate to not need 'e'.
    // Assuming handleUpdate needs an event for preventDefault():
    const fakeEvent = { preventDefault: () => {} } as any;

    updateInput.handleUpdate({
      e: fakeEvent,
      id: updateInput.id,
      type: "review",
      rating: data.rating,
      text: data.text,
    });
  };

  return (
    <div className="rounded bg-gray-900 p-4">
      <ReviewForm
        initialRating={updateInput.rating}
        initialText={updateInput.text}
        isSubmitting={updateInput.isUpdatePending}
        onCancel={() => updateInput.setIsEditing(false)}
        submitLabel="Save Changes"
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
