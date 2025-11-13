// src/app/_components/review/reviews/ReviewsFallback.tsx

import ReviewOrReplyFallback from './ReviewOrReplyFallback';

export default function ReviewsFallback() {
  // Render a few skeleton loaders to represent a list
  return (
    <div className="flex flex-col gap-2 lg:gap-4">
      {[...Array(2)].map((_, i) => (
        <ReviewOrReplyFallback key={i} />
      ))}
    </div>
  );
}
