// src/app/_components/review/write-form/ReviewForm.tsx
"use client";

import { useState, type FormEvent } from "react";
import StarRating from "../rating/StarRating";

interface ReviewFormProps {
  initialRating?: number;
  initialText?: string;
  isSubmitting: boolean;
  onCancel?: () => void;
  onSubmit: (data: { rating: number; text: string }) => void;
  submitLabel?: string;
}

export default function ReviewForm({
  initialRating = 0,
  initialText = "",
  isSubmitting,
  onCancel,
  onSubmit,
  submitLabel = "Submit",
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState(initialText);
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please provide a rating.");
      return;
    }
    if (text.trim() === "") {
      setError("Please provide a comment.");
      return;
    }
    setError("");
    onSubmit({ rating, text });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
      {error && <p className="text-red-400">{error}</p>}

      {/* Rating */}
      <div className="flex flex-col gap-1">
        <span className="block font-medium text-gray-200">Rating</span>
        <div className="flex items-center rounded bg-gray-800 px-3 py-2.5">
          <StarRating rating={rating} setRating={setRating} />
        </div>
      </div>

      {/* Comment */}
      <div className="flex flex-col gap-1">
        <label className="block font-medium text-gray-200">Comment</label>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience..."
          className="w-full rounded bg-gray-800 px-3 py-2 text-gray-300 outline-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-400"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-indigo-600 px-4 py-2 font-semibold text-gray-200 hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
