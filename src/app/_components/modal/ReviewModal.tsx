import { useEffect } from "react";
import WriteReview from "../review/write-form/WriteReview";
import { api } from "~/trpc/react";
import { handleOverlayClick } from "~/server/utils/modal";

type ReviewModalProps = {
  itemIds: { productId: string; productVariantId: string } | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function ReviewModal({
  itemIds,
  isOpen,
  onClose,
}: ReviewModalProps) {
  const { data: existingReview, isFetching } =
    api.comment.getUserReviewForProduct.useQuery(
      { productId: itemIds?.productId ?? "" },
      { enabled: !!itemIds?.productId && isOpen },
    );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !itemIds) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
      onMouseDown={(e) => handleOverlayClick(e, onClose)}
    >
      <div
        className="w-lg max-w-[90vw]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {isFetching ? (
          <div className="rounded bg-gray-900 p-8 text-center text-gray-500">
            <p className="animate-pulse">Loading review...</p>
          </div>
        ) : (
          <WriteReview
            productId={itemIds.productId}
            productVariantId={itemIds.productVariantId}
            existingReview={existingReview} // Pass data (will be null or object)
            onSuccess={onClose}
          />
        )}
      </div>
    </div>
  );
}
