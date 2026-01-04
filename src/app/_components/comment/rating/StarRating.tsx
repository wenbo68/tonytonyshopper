"use client";

import { FaStar, FaStarHalf } from "react-icons/fa";

export default function StarRating({
  rating,
  setRating,
  interactive = true,
}: {
  rating: number;
  setRating?: (rating: number) => void;
  interactive?: boolean;
}) {
  const starSize = "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((starValue) => {
        let icon;

        if (rating >= starValue) {
          // Full Star
          icon = <FaStar className={`text-yellow-500/80 ${starSize}`} />;
        } else if (rating >= starValue - 0.99) {
          // Layered Half Star
          icon = (
            <div className={`relative ${starSize}`}>
              {/* Bottom Layer: Full Gray Star */}
              <FaStar className="absolute top-0 left-0 h-full w-full text-gray-600" />
              {/* Top Layer: Half Yellow Star */}
              <FaStarHalf className="absolute top-0 left-0 h-full w-full text-yellow-500/80" />
            </div>
          );
        } else {
          // Empty Star
          icon = <FaStar className={`text-gray-600 ${starSize}`} />;
        }

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => interactive && setRating?.(starValue)}
            className={`focus:outline-none ${
              interactive ? "cursor-pointer" : ""
            }`}
            aria-label={`Rate ${starValue} stars`}
            disabled={!interactive}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
