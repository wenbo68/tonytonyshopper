"use client";

import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
// import toast from "react-hot-toast";
import { useProductContext } from "~/app/_contexts/ProductProvider";
import { customToast } from "~/app/_components/toast";
import { api } from "~/trpc/react";
import type { UpdateCommentInput } from "~/type";

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

  const [text, setText] = useState(updateInput?.text ?? "");
  const [error, setError] = useState("");

  const invalidateQueries = async (productId: string) => {
    await utils.comment.getCommentTree.invalidate();
    // await utils.comment.getAverageRating.invalidate({ productId });
    // await utils.comment.getUserReviewForProduct.invalidate({ productId });
  };

  const addMutation = api.comment.add.useMutation({
    // onMutate: () => {
    //   const toastId = customToast.loading("Adding...");
    //   return { toastId };
    // },
    onSuccess: async (data, input, context) => {
      await invalidateQueries(productId);
      // customToast.success("Add succeeded.", context?.toastId);
      handleCancel();
    },
    onError: (err, input, context) => {
      void invalidateQueries(productId);
      setError("Failed to add reply. Please try again.");
      // customToast.error("Add failed. Please try again.", context?.toastId);
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addInput) {
      setError("Something went wrong. Please cancel and try again.");
      return;
    }
    if (text.trim() === "") {
      setError("Please provide a valid comment.");
      return;
    }
    addMutation.mutate({ productId, parentId: addInput.parentId, text });
  };

  const handleCancel = () => {
    if (addInput) {
      addInput.setIsWritingReply(false);
    } else {
      updateInput?.setIsEditing(false);
    }
    setError("");
  };

  const handleSubmit = (e: FormEvent<Element>) =>
    updateInput
      ? updateInput.handleUpdate({
          e,
          id: updateInput.id,
          type: "reply",
          rating: undefined,
          text,
        })
      : handleAdd(e);

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-2 bg-gray-900 ${
        updateInput ? "" : "pt-5 pl-10"
      } rounded text-sm text-gray-500`}
    >
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a reply..."
          className="scrollbar-hide w-full rounded bg-gray-800 p-2 text-gray-400 outline-none"
          rows={2}
          autoFocus
        ></textarea>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={updateInput?.isUpdatePending || addMutation.isPending}
            className="cursor-pointer hover:text-gray-400 disabled:cursor-default disabled:hover:text-gray-500"
          >
            Cancel
          </button>
          {updateInput ? (
            <button
              type="submit"
              disabled={updateInput?.isUpdatePending}
              className="cursor-pointer hover:text-gray-400 disabled:cursor-default disabled:hover:text-gray-500"
            >
              {updateInput.isUpdatePending ? "Saving" : "Save"}
            </button>
          ) : (
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="cursor-pointer hover:text-gray-400 disabled:cursor-default disabled:hover:text-gray-500"
            >
              {addMutation.isPending ? "Submitting" : "Submit"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
