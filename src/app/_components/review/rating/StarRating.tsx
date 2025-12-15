'use client';

import { FaStar, FaStarHalf } from 'react-icons/fa';

export default function StarRating({
  rating,
  setRating,
  interactive = true,
}: {
  rating: number;
  setRating?: (rating: number) => void;
  interactive?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starValue) => {
        let icon;

        if (rating >= starValue) {
          // Full Star
          icon = <FaStar className="w-4 h-4 text-yellow-500/80" />;
        } else if (rating >= starValue - 0.99) {
          // Layered Half Star
          icon = (
            <div className="relative w-4 h-4">
              {/* Bottom Layer: Full Gray Star */}
              <FaStar className="absolute top-0 left-0 w-full h-full text-gray-600" />
              {/* Top Layer: Half Yellow Star */}
              <FaStarHalf className="absolute top-0 left-0 w-full h-full text-yellow-500/80" />
            </div>
          );
        } else {
          // Empty Star
          icon = <FaStar className="w-4 h-4 text-gray-600" />;
        }

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => interactive && setRating?.(starValue)}
            className={`focus:outline-none ${
              interactive ? 'cursor-pointer' : ''
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
