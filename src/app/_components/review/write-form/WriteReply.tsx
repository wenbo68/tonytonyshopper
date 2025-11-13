'use client';

import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react';
import toast from 'react-hot-toast';
import { useProductContext } from '~/app/_contexts/ProductProvider';
import { api } from '~/trpc/react';
import type { UpdateCommentInput } from '~/type';

interface AddReplyFields {
  parentId: string;
  setIsWritingReply: Dispatch<SetStateAction<boolean>>;
}

interface UpdateReplyFields {
  id: string;
  text: string;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  handleUpdate: ({ e, id, type, rating, text }: UpdateCommentInput) => void;
  isUpdatePending: boolean;
}

type WriteReviewProps =
  | {
      // setError: Dispatch<SetStateAction<string>>;
      addInput: AddReplyFields;
      updateInput?: never;
    }
  | {
      // setError: Dispatch<SetStateAction<string>>;
      addInput?: never;
      updateInput: UpdateReplyFields;
    };

export default function WriteReply({
  // setError,
  addInput,
  updateInput,
}: WriteReviewProps) {
  // const { data: session } = useSession();
  const utils = api.useUtils();
  const { productId } = useProductContext();

  const [text, setText] = useState(updateInput?.text ?? '');

  const [error, setError] = useState('');

  const addMutation = api.comment.add.useMutation({
    onError: (err, newReply, context) => {
      void utils.comment.getCommentTree.invalidate();

      toast.custom((t) => (
        <div className={`rounded bg-gray-700 px-4 py-2 text-sm text-gray-300`}>
          Submission failed. Please try again.
        </div>
      ));
    },

    onSuccess: () => {
      void utils.comment.getCommentTree.invalidate();

      // This can now be safely called after setting data
      addInput?.setIsWritingReply(false);
      setText('');

      toast.custom((t) => (
        <div className={`rounded bg-gray-700 px-4 py-2 text-sm text-gray-300`}>
          Submission succeeded.
        </div>
      ));
    },

    onSettled: () => {
      // void utils.comment.getCommentTree.invalidate();
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    if (!addInput) return;
    e.preventDefault();
    if (text.trim() === '') return;
    addMutation.mutate({ productId, parentId: addInput.parentId, text });
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <form
        onSubmit={(e: FormEvent<Element>) =>
          updateInput
            ? updateInput.handleUpdate({
                e,
                id: updateInput.id,
                type: 'reply',
                rating: undefined,
                text,
              })
            : handleAdd(e)
        }
        className={`flex flex-col gap-3 bg-gray-900 ${
          updateInput ? '' : 'pl-10 pt-5 '
        }rounded text-sm text-gray-500`}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a reply..."
          className="w-full bg-gray-800 text-gray-400 rounded p-2 outline-none scrollbar-hide"
          rows={2}
        ></textarea>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              if (addInput) {
                addInput.setIsWritingReply(false);
              } else {
                updateInput?.setIsEditing(false);
              }
              setError('');
            }}
            disabled={updateInput?.isUpdatePending || addMutation.isPending}
            className="hover:text-gray-400 cursor-pointer disabled:hover:text-gray-500 disabled:cursor-default"
          >
            Cancel
          </button>
          {updateInput ? (
            <button
              type="submit"
              disabled={updateInput?.isUpdatePending}
              className="hover:text-gray-400 cursor-pointer disabled:hover:text-gray-500 disabled:cursor-default"
            >
              {updateInput.isUpdatePending ? 'Saving' : 'Save'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="hover:text-gray-400 cursor-pointer disabled:hover:text-gray-500 disabled:cursor-default"
            >
              {addMutation.isPending ? 'Submitting' : 'Submit'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
