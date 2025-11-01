'use client';

import Link from 'next/link';
import Image from 'next/image';
import { api } from '~/trpc/react';

export default function ProductPage() {
  // 1. Fetch data in the client using our tRPC procedure
  const { data: products } = api.product.getAll.useQuery();

  if (!products || products?.length === 0) {
    return <p>No products found. Please check back later!</p>;
  }

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCard({
  product,
}: {
  product: {
    name: string;
    id: string;
    description: string | null;
    price: string;
    images: string[] | null;
    stock: number;
    isFeatured: boolean;
    createdAt: Date | null;
    updatedAt: Date | null;
  };
}) {
  // Get the first image, or use a placeholder
  const firstImage =
    product.images?.[0] ?? 'https://placehold.co/600x600/eee/ccc?text=No+Image';

  return (
    <Link
      href={`/product/${product.id}`} // We'll build this page next
      className="group"
    >
      <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-h-8 xl:aspect-w-7">
        <Image
          src={firstImage}
          alt={product.name ?? 'Product image'}
          width={600}
          height={600}
          className="h-full w-full object-cover object-center group-hover:opacity-75"
        />
      </div>
      <h3 className="mt-4 text-sm text-gray-700">{product.name}</h3>
      <p className="mt-1 text-lg font-medium text-gray-900">
        {formatCurrency(product.price)}
      </p>
    </Link>
  );
}

/**
 * Helper function to format the price string (from Drizzle) into a currency.
 * Drizzle returns 'numeric' types as strings.
 */
function formatCurrency(priceString: string | null | undefined) {
  if (!priceString) {
    return 'N/A';
  }
  const price = parseFloat(priceString);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}
