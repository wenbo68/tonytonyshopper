'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import type { CommentTree, UpdateCommentInput } from '~/type';
import StarRating from '../../rating/StarRating';
import { api } from '~/trpc/react';
import WriteReply from '../write-form/WriteReply';
import WriteReview from '../write-form/WriteReview';
import { TbDotsVertical } from 'react-icons/tb';
import { useMutationState } from '@tanstack/react-query';
import { dequal } from 'dequal';
import toast from 'react-hot-toast';

export default function ReviewOrReply({
  comment,
  className,
}: {
  comment: CommentTree;
  className?: string;
}) {
  const { data: session } = useSession();
  const utils = api.useUtils();

  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isWritingReply, setIsWritingReply] = useState(false);

  const [updateError, setUpdateError] = useState('');
  const [deleteError, setDeleteError] = useState('');

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Cleanup the event listener on component unmount
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const deleteMutation = api.comment.delete.useMutation({
    onError: (err, variables, context) => {
      void utils.comment.getAverageRating.invalidate();
      void utils.comment.getCommentTree.invalidate();

      toast.custom((t) => (
        <div className={`rounded bg-gray-700 px-4 py-2 text-sm text-gray-300`}>
          Deletion failed. Please try again.
        </div>
      ));
    },
    onSuccess: () => {
      void utils.comment.getAverageRating.invalidate();
      void utils.comment.getCommentTree.invalidate();

      toast.custom((t) => (
        <div className={`rounded bg-gray-700 px-4 py-2 text-sm text-gray-300`}>
          Deletion succeeded.
        </div>
      ));
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate({ id: comment.id });
  };

  const updateMutation = api.comment.update.useMutation({
    onError: (err, variables, context) => {
      void utils.comment.getAverageRating.invalidate();
      void utils.comment.getCommentTree.invalidate();

      toast.custom((t) => (
        <div className={`rounded bg-gray-700 px-4 py-2 text-sm text-gray-300`}>
          Update failed. Please try again.
        </div>
      ));
    },
    onSuccess: () => {
      void utils.comment.getAverageRating.invalidate();
      void utils.comment.getCommentTree.invalidate();
      setIsEditing(false);

      toast.custom((t) => (
        <div className={`rounded bg-gray-700 px-4 py-2 text-sm text-gray-300`}>
          Update succeeded.
        </div>
      ));
    },
  });

  const handleUpdate = ({ e, id, type, rating, text }: UpdateCommentInput) => {
    e.preventDefault();
    if (type === 'review') {
      if (rating === 0) {
        setUpdateError('Please provide a rating.');
        return;
      }
    }
    if (text.trim() === '') {
      setUpdateError('Please provide a valid comment.');
      return;
    }
    setUpdateError('');
    updateMutation.mutate({
      id,
      text,
      rating,
    });
  };

  const isAuthor = session?.user?.id === comment.userId;

  // Check if a reply is being added to this comment
  const pendingAddMutations = useMutationState({
    filters: { status: 'pending' }, // We only care about pending mutations
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
      dequal(m.key?.[0], ['comment', 'add']) && // Does the path match?
      m.variables?.parentId === comment.id // Does the parentId match?
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
      label: 'Reply',
      // disabledLabel: 'Replying',
      onClick: () => {
        setIsWritingReply((prev) => !prev);
        setShowDropdown(!showDropdown);
      },
    },
    {
      display: isAuthor,
      // disabled: updateMutation.isPending,
      label: 'Edit',
      // disabledLabel: 'Editing',
      onClick: () => {
        setIsEditing(true);
        setShowDropdown(!showDropdown);
      },
    },
    {
      display: isAuthor,
      // disabled: updateMutation.isPending, // disable delete when updating
      label: 'Delete',
      // disabledLabel: 'Deleting',
      onClick: () => {
        handleDelete();
        setShowDropdown(!showDropdown);
      },
    },
  ];

  return (
    <div className={`bg-gray-900 rounded ${className ?? ''}`}>
      {isEditing ? (
        comment.parentId ? (
          // rely edit mode: need an error here (bc handleUpdate is defined here)
          <div className="flex flex-col gap-2">
            {updateError && (
              <p className="text-sm text-red-400">{updateError}</p>
            )}
            <WriteReply
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
            <WriteReview
              updateInput={{
                id: comment.id,
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
          {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}
          <div className="flex gap-3">
            <Image
              src={comment.user.image ?? ''}
              alt={comment.user.name ?? 'User'}
              width={40}
              height={40}
              className="w-8 h-8 rounded-full"
            />
            <div className="w-full flex flex-col gap-2">
              <div className="flex flex-col">
                <div className="flex justify-between">
                  {/* username */}
                  <p className="text-sm font-semibold text-gray-400">
                    {comment.user.name}
                  </p>

                  <div className="relative flex gap-2 items-center">
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
                        className="absolute top-full z-10 mt-2 w-full rounded bg-gray-800 p-2"
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
                                  className={`w-full rounded p-2 text-left text-xs font-semibold hover:bg-gray-900 hover:text-blue-400 disabled:hover:bg-gray-800 disabled:hover:text-gray-400 transition-colors cursor-pointer disabled:cursor-default`}
                                >
                                  {option.label}
                                </button>
                              ) : null;
                            })
                          ) : (
                            <p className="text-xs">Processing. Please wait.</p>
                          )
                        ) : (
                          <p className="text-xs">
                            Please login to interact with the reviews.
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
                      {new Date(comment.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                )}
              </div>

              {/* text */}
              <p className="text-sm text-gray-400">{comment.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* write reply form */}
      {isWritingReply && (
        <WriteReply
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
            <ReviewOrReply
              key={reply.id}
              comment={reply}
              className="pl-10 mt-5"
            />
          ))}
        </div>
      )}
    </div>
  );
}
