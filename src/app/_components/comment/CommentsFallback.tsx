// src/app/_components/review/reviews/ReviewsFallback.tsx

import CommentFallback from "./CommentFallback";

export default function CommentsFallback() {
  // Render a few skeleton loaders to represent a list
  return (
    <div className="flex flex-col gap-2 lg:gap-4">
      {[...Array(2)].map((_, i) => (
        <CommentFallback key={i} />
      ))}
    </div>
  );
}
