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
import { useProductContext } from "~/app/_contexts/ProductProvider";
import { customToast } from "~/app/_components/toast";
import { MediaGrid, type MediaItem } from "../../MediaGrid";
import type { MediaType } from "~/server/db/schema";

interface UpdateReviewFields {
  commentId: string;
  rating: number;
  text: string;
  media: {
    key: string;
    url: string;
    type: MediaType;
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

  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);

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
  }, []);

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

  const { data: canReview, isLoading: isCheckingEligibility } =
    api.comment.getCanReview.useQuery(
      { productId },
      { enabled: !!session && !updateInput },
    );

  const invalidateQueries = async (productId: string) => {
    await utils.comment.getCommentTree.invalidate();
    await utils.comment.getAverageRating.invalidate({ productId });
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
      media: prepareMediaPayload(), // Add media payload
    });
  };

  const handleCancel = () => {
    updateInput?.setIsEditing(false);
    setError("");
  };

  const handleSubmit = (e: FormEvent<Element>) => {
    if (updateInput) {
      updateInput.handleUpdate({
        e,
        id: updateInput.commentId,
        type: "review",
        rating,
        text,
        media: prepareMediaPayload(),
      });
    } else {
      handleAdd(e as React.FormEvent);
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

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className={`bg-gray-900 ${
          updateInput ? `` : `p-5`
        } flex flex-col gap-4 rounded text-sm text-gray-400`}
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex w-full flex-col gap-1">
            <span className="block font-medium">Rating</span>
            <div className="flex items-center rounded bg-gray-800 px-3 py-2.5">
              <StarRating rating={rating} setRating={setRating} />
            </div>
          </div>
        </div>

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

        {/* --- Using MediaGrid --- */}
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
