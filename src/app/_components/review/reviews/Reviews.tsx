'use client';

import { useSearchParams } from 'next/navigation';
import { api } from '~/trpc/react';
import { GetCommentTreeInputSchema } from '~/type';
import ReviewOrReply from './ReviewOrReply';
import Pagination from '../../pagination/Pagination';
import ReviewsFallback from './ReviewsFallback';
import { useProductContext } from '~/app/_contexts/ProductProvider';

export default function Reviews() {
  const { productId } = useProductContext();

  // 1. Get input from url (zod optional doesn't accept null so must use undefined)
  const searchParams = useSearchParams();
  const rating = searchParams.getAll('rating').map(Number);
  const order = searchParams.get('order') ?? undefined;
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1; // must not let it default to 0 when page is empty string

  // 2. Construct the tRPC input object from the context state
  const rawInput = {
    productId,
    rating,
    order,
    page,
    pageSize: 10,
  };

  // 3. Validate the raw input using the shared schema
  const parsedInput = GetCommentTreeInputSchema.safeParse(rawInput);

  // 4. if invalid input, don't call trpc procedure
  if (!parsedInput.success) {
    // You can optionally render an error state if the filters are somehow invalid
    console.error('Zod validation failed:', parsedInput.error);
    return (
      <p className="text-gray-300 font-semibold">Invalid search options.</p>
    );
  }

  // 5. call procedure to fetch data
  const { data: commentData, isFetching } = api.comment.getCommentTree.useQuery(
    parsedInput.success ? parsedInput.data : (undefined as any),
    {
      enabled: parsedInput.success,
      staleTime: 0, // always refetch immediately on input change
    }
  );

  // 5. Show a skeleton while fetching new data
  if (isFetching) {
    return <ReviewsFallback />;
  }

  // 6. Render the results
  if (!commentData) return null;
  const { commentTree, totalPages } = commentData;

  return (
    <>
      {/* reviews */}
      {commentTree.length > 0 ? (
        <div className="flex flex-col gap-2 lg:gap-4">
          {commentTree.map((comment) => (
            <ReviewOrReply key={comment.id} comment={comment} className="p-5" />
          ))}
        </div>
      ) : null}

      {/* pagination */}
      <Pagination currentPage={page ?? 1} totalPages={totalPages} />
    </>
  );
}
