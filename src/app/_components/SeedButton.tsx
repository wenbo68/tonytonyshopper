'use client';
import { api } from '~/trpc/react';

// This component must be a client component

export default function SeedButton() {
  const seedMutation = api.product.seedDatabase.useMutation({
    onSuccess: (data) => {
      alert(data.message);
      // Automatically refresh the page to show the new products
      window.location.reload();
    },
    onError: (error) => {
      alert(`Error seeding: ${error.message}`);
    },
  });

  const handleSeed = () => {
    if (confirm('Are you sure you want to delete all products and re-seed?')) {
      seedMutation.mutate();
    }
  };

  return (
    <button
      onClick={handleSeed}
      disabled={seedMutation.isPending}
      className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
    >
      {seedMutation.isPending ? 'Seeding...' : 'Seed Database'}
    </button>
  );
}
