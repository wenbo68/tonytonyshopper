"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import type { CommentTree, UpdateCommentInput } from "~/type";
import StarRating from "./rating/StarRating";
import { api } from "~/trpc/react";
import WriteOrUpdateReply from "./write-or-update-form/WriteOrUpdateReply";
import { TbDotsVertical } from "react-icons/tb";
import { useMutationState } from "@tanstack/react-query";
import { dequal } from "dequal";
// import toast from "react-hot-toast";
import { useProductContext } from "~/app/_contexts/ProductProvider";
import WriteOrUpdateReview from "./write-or-update-form/WriteOrUpdateReview";
import { customToast } from "~/app/_components/toast";

export default function Comment({
  comment,
  className,
}: {
  comment: CommentTree;
  className?: string;
}) {
  const { data: session } = useSession();
  const { productId } = useProductContext();
  const utils = api.useUtils();

  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isWritingReply, setIsWritingReply] = useState(false);

  const [updateError, setUpdateError] = useState("");
  // const [deleteError, setDeleteError] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Effect to handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Cleanup the event listener on component unmount
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const invalidateQueries = async (productId: string) => {
    utils.comment.getAverageRating.invalidate({ productId });
    await utils.comment.getCommentTree.invalidate();
    // await utils.comment.getUserReviewForProduct.invalidate({ productId });
  };

  const deleteMutation = api.comment.delete.useMutation({
    onMutate: () => {
      const toastId = customToast.loading("Deleting...");
      return { toastId };
    },
    onSuccess: async (data, input, context) => {
      await invalidateQueries(productId);
      customToast.success("Delete succeeded.", context?.toastId);
    },
    onError: (err, input, context) => {
      void invalidateQueries(productId);
      // setError("Failed to delete review. Please try again.");
      customToast.error("Delete failed. Please try again.", context?.toastId);
      // console.error("ReviewOrReply deleteMutation onError:", err);
    },
    // onSettled: () => invalidateQueries(productId),
  });

  const handleDelete = () => {
    deleteMutation.mutate({ id: comment.id });
  };

  const updateMutation = api.comment.update.useMutation({
    // onMutate: () => {
    //   const toastId = customToast.loading("Updating...");
    //   return { toastId };
    // },
    onSuccess: async (data, input, context) => {
      await invalidateQueries(productId);
      // customToast.success("Update succeeded.", context?.toastId);
      setIsEditing(false);
    },
    onError: (err, input, context) => {
      void invalidateQueries(productId);
      setUpdateError("Failed to update. Please try again.");
      // customToast.error("Update failed. Please try again.", context?.toastId);
      // console.error("ReviewOrReply updateMutation onError:", err);
    },
  });

  const handleUpdate = ({ e, id, type, rating, text }: UpdateCommentInput) => {
    e.preventDefault();
    if (type === "review") {
      if (rating === 0) {
        setUpdateError("Please provide a rating.");
        return;
      }
    }
    if (text.trim() === "") {
      setUpdateError("Please provide a valid comment.");
      return;
    }
    setUpdateError("");
    updateMutation.mutate({
      id,
      text,
      rating,
    });
  };

  const isAuthor = session?.user?.id === comment.userId;

  // Check if a reply is being added to this comment
  const pendingAddMutations = useMutationState({
    filters: { status: "pending" }, // We only care about pending mutations
    // The predicate function gives us full control to inspect each mutation
    select: (mutation) => ({
      // We select both the key and the variables for our check
      key: mutation.options.mutationKey,
      variables: mutation.state.variables as { parentId?: string },
    }),
  });
  const isAddingReply = pendingAddMutations.some(
    (m) =>
      // dequal is a fast way to check if two arrays are identical
      dequal(m.key?.[0], ["comment", "add"]) && // Does the path match?
      m.variables?.parentId === comment.id, // Does the parentId match?
  );

  // NEW: Create a single flag to know if this comment is busy
  const isMutating =
    isAddingReply || updateMutation.isPending || deleteMutation.isPending;

  const dropdownOptions: {
    display: boolean;
    // disabled: boolean;
    label: string;
    // disabledLabel: string;
    onClick: () => void;
  }[] = [
    {
      display: !!session,
      // disabled: isAddingReply,
      label: "Reply",
      // disabledLabel: 'Replying',
      onClick: () => {
        setIsWritingReply((prev) => !prev);
        setShowDropdown(!showDropdown);
      },
    },
    {
      display: isAuthor,
      // disabled: updateMutation.isPending,
      label: "Edit",
      // disabledLabel: 'Editing',
      onClick: () => {
        setIsEditing(true);
        setShowDropdown(!showDropdown);
      },
    },
    {
      display: isAuthor,
      // disabled: updateMutation.isPending, // disable delete when updating
      label: "Delete",
      // disabledLabel: 'Deleting',
      onClick: () => {
        handleDelete();
        setShowDropdown(!showDropdown);
      },
    },
  ];

  return (
    <div className={`rounded bg-gray-900 ${className ?? ""}`}>
      {isEditing ? (
        comment.parentId ? (
          // rely edit mode: need an error here (bc handleUpdate is defined here)
          <div className="flex flex-col gap-2">
            {updateError && (
              <p className="text-sm text-red-400">{updateError}</p>
            )}
            <WriteOrUpdateReply
              updateInput={{
                id: comment.id,
                text: comment.text,
                setIsEditing,
                handleUpdate,
                isUpdatePending: updateMutation.isPending,
              }}
            />
          </div>
        ) : (
          // review edit mode: need an error here (for the same reason)
          <div className="flex flex-col gap-2">
            {updateError && (
              <p className="text-sm text-red-400">{updateError}</p>
            )}
            <WriteOrUpdateReview
              // productId={productId}
              updateInput={{
                commentId: comment.id,
                rating: comment.rating ?? 0,
                text: comment.text,
                setIsEditing,
                handleUpdate,
                isUpdatePending: updateMutation.isPending,
              }}
            />
          </div>
        )
      ) : (
        // show review/reply
        <div className="flex flex-col gap-2">
          {/* {deleteError && <p className="text-sm text-red-400">{deleteError}</p>} */}
          <div className="flex gap-3">
            <Image
              src={comment.user.image ?? ""}
              alt={comment.user.name ?? "User"}
              width={40}
              height={40}
              className="h-8 w-8 rounded-full"
            />
            <div className="flex w-full flex-col gap-2">
              <div className="flex flex-col">
                <div className="flex justify-between">
                  {/* username */}
                  <p className="text-sm font-semibold text-gray-400">
                    {comment.user.name}
                  </p>

                  <div className="relative flex items-center gap-2">
                    {/* rating */}
                    {comment.rating ? (
                      <StarRating rating={comment.rating} interactive={false} />
                    ) : (
                      <div className="min-w-24"></div>
                    )}
                    {/* dropdown */}
                    <TbDotsVertical
                      onClick={(e) => setShowDropdown(!showDropdown)}
                      className="cursor-pointer"
                    />
                    {showDropdown && (
                      <div
                        ref={dropdownRef}
                        className="absolute top-full z-10 mt-2 w-full rounded bg-gray-800 p-1"
                      >
                        {/* only show dropdown if user is logged in and if the review/reply is not optimistic */}
                        {session ? (
                          !isMutating ? (
                            dropdownOptions.map((option) => {
                              return option.display ? (
                                <button
                                  key={option.label}
                                  type="button"
                                  onClick={option.onClick}
                                  className={`w-full cursor-pointer rounded p-2 text-left text-xs font-semibold transition-colors hover:bg-gray-900 hover:text-blue-400 disabled:cursor-default disabled:hover:bg-gray-800 disabled:hover:text-gray-400`}
                                >
                                  {option.label}
                                </button>
                              ) : null;
                            })
                          ) : (
                            <p className="px-2 py-1.5 text-left text-xs font-semibold">
                              Processing...
                            </p>
                          )
                        ) : (
                          <p className="px-2 py-1.5 text-left text-xs font-semibold">
                            Please login first.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {comment.createdAt && (
                  <div className="flex gap-3 text-xs text-gray-500">
                    {/* time */}
                    <span className="">
                      {new Date(comment.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 pl-1.5">
            {/* text */}
            <p className="text-sm text-gray-400">{comment.text}</p>
            {/* NEW: Render Media */}
            {comment.media && comment.media.length > 0 && (
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {comment.media.map((mediaItem) => (
                  <div
                    key={mediaItem.id}
                    className="relative h-23 w-23 overflow-hidden rounded bg-black sm:h-29 sm:w-29"
                  >
                    {mediaItem.type === "video" ? (
                      <video
                        src={mediaItem.url}
                        className="h-full w-full object-contain"
                        controls
                      />
                    ) : (
                      <Image
                        src={mediaItem.url}
                        alt="Review media"
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* write reply form */}
      {isWritingReply && (
        <WriteOrUpdateReply
          addInput={{
            parentId: comment.id,
            setIsWritingReply,
          }}
        />
      )}

      {/* all replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 border-gray-800">
          {comment.replies.map((reply) => (
            <Comment key={reply.id} comment={reply} className="mt-5 pl-10" />
          ))}
        </div>
      )}
    </div>
  );
}
