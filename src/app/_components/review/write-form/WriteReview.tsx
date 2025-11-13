'use client';

import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/trpc/react';
import StarRating from '../../rating/StarRating';
import type { UpdateCommentInput } from '~/type';
import toast from 'react-hot-toast';
import { useProductContext } from '~/app/_contexts/ProductProvider';

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

  const [rating, setRating] = useState(updateInput ? updateInput.rating : 0);
  const [text, setText] = useState(updateInput ? updateInput.text : '');

  const [error, setError] = useState('');

  const addMutation = api.comment.add.useMutation({
    onError: (err, newReview, context) => {
      void utils.comment.getAverageRating.invalidate();
      void utils.comment.getCommentTree.invalidate();

      console.error('WriteReview addMutation onError:', err);
      setError('Failed to add review. Please try again.');

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
      setText('');

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
      setError('Please provide a rating.');
      return;
    }
    if (text.trim() === '') {
      setError('Please provide a valid comment.');
      return;
    }
    setError('');
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
        } rounded flex flex-col gap-4 text-gray-400 text-sm`}
      >
        Please login first to submit a review.
      </p>
    );

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <form
        onSubmit={(e: FormEvent<Element>) =>
          updateInput
            ? updateInput.handleUpdate({
                e,
                id: updateInput.id,
                type: 'review',
                rating,
                text,
              })
            : handleAdd(e)
        }
        className={`bg-gray-900 ${
          updateInput ? `` : `p-5`
        } rounded flex flex-col gap-4 text-gray-400 text-sm`}
      >
        {/* rating */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full flex flex-col gap-1">
            <span className="block font-medium">Rating</span>
            <div className="bg-gray-800 rounded px-3 py-2.5 flex items-center">
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
            className="w-full bg-gray-800 rounded py-2 px-3 outline-none scrollbar-hide"
          ></textarea>
        </div>

        {/* save/cancel for editing; submit button for adding*/}
        {updateInput ? (
          <div className="flex justify-end gap-4 text-gray-500">
            <button
              type="button"
              onClick={() => {
                updateInput.setIsEditing(false);
                setError('');
              }}
              disabled={updateInput.isUpdatePending}
              className="hover:text-gray-400 cursor-pointer disabled:hover:text-gray-500 disabled:cursor-default"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateInput.isUpdatePending}
              className="hover:text-gray-400 cursor-pointer disabled:hover:text-gray-500 disabled:cursor-default"
            >
              {updateInput.isUpdatePending ? 'Saving' : 'Save'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="min-w-36 bg-blue-600/50 hover:bg-blue-500/50 text-gray-300 font-semibold py-2 px-4 rounded transition-all disabled:bg-blue-600/50 cursor-pointer disabled:cursor-default"
            >
              {addMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
