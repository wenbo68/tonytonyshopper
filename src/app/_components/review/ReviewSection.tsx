'use client'; // 1. Make this a Client Component

import ReviewFilters from './ReviewFilters';
import AvgRating from '../rating/AvgRating';
import WriteReview from './write-form/WriteReview';
import Reviews from './reviews/Reviews';
import ReviewLabels from './ReviewLabels';
import { ProductProvider } from '~/app/_contexts/ProductProvider';

export default function ReviewSection({ productId }: { productId: string }) {
  return (
    // 3. Wrap all children in the provider
    <ProductProvider productId={productId}>
      <section className="flex flex-col gap-5">
        {/* title */}
        <div className="flex flex-col gap-0">
          <h2 className="text-lg font-semibold text-gray-300">Reviews</h2>
          <p className="text-sm text-gray-500">
            See what others are saying... or say something yourself!
          </p>
        </div>

        {/* 4. Remove productId prop from all children */}
        <AvgRating />
        <WriteReview />
        <ReviewFilters />
        <ReviewLabels />
        <Reviews />
      </section>
    </ProductProvider>
  );
}
