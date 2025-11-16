// src/app/admin/add-product/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

// Define the shape of a variant based on your admin router's input
type VariantState = {
  name: string;
  price: string; // Use string for form input
  stock: string; // Use string for form input
  images: string; // Comma-separated URLs
  options: string; // JSON string, e.g., {"color": "Red", "size": "M"}
};

export default function AddProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrls, setVideoUrls] = useState(""); // Comma-separated URLs
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantState[]>([]);
  const [error, setError] = useState<string | null>(null);

  // tRPC Queries & Mutations
  const { data: categories, isLoading: isLoadingCategories } =
    api.product.getCategories.useQuery();

  const addProductMutation = api.admin.add.useMutation({
    onSuccess: (data) => {
      // Product added successfully, redirect to the new product's page or all products
      alert(`Product "${name}" added with ID: ${data.id}`);
      router.push(`/product/all`);
    },
    onError: (err) => {
      setError(
        `Failed to add product: ${err.message}. Check console for details.`,
      );
      console.error(err);
    },
  });

  // Variant state handlers
  const addVariant = () => {
    setVariants([
      ...variants,
      { name: "", price: "0", stock: "0", images: "", options: "{}" },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: keyof VariantState,
    value: string,
  ) => {
    const newVariants = [...variants];
    // Build an updated variant and assert the type so all required fields are present
    const updatedVariant = {
      ...newVariants[index],
      [field]: value,
    } as VariantState;
    newVariants[index] = updatedVariant;
    setVariants(newVariants);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );
    setCategoryIds(selectedOptions);
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // --- 1. Basic Validation ---
    if (variants.length === 0) {
      setError("You must add at least one product variant.");
      return;
    }
    if (categoryIds.length === 0) {
      setError("You must select at least one category.");
      return;
    }

    // --- 2. Data Transformation ---
    let transformedVariants;
    try {
      transformedVariants = variants.map((v) => {
        // Parse numbers
        const price = parseFloat(v.price);
        const stock = parseInt(v.stock, 10);
        if (isNaN(price) || isNaN(stock)) {
          throw new Error("Price and Stock must be valid numbers.");
        }
        if (price <= 0) {
          throw new Error("Price must be greater than 0.");
        }

        // Parse images
        const images =
          v.images.trim() === ""
            ? []
            : v.images.split(",").map((url) => url.trim());

        // Parse options JSON
        const options = JSON.parse(v.options);
        if (
          typeof options !== "object" ||
          Array.isArray(options) ||
          options === null
        ) {
          throw new Error(
            'Options must be a valid JSON object, e.g., {"color": "Red"}',
          );
        }

        return {
          name: v.name,
          price,
          stock,
          images,
          options,
        };
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? `Invalid variant data: ${err.message}`
          : "Invalid variant data.",
      );
      return;
    }

    const transformedVideos =
      videoUrls.trim() === ""
        ? []
        : videoUrls.split(",").map((url) => url.trim());

    // --- 3. Call the Mutation ---
    addProductMutation.mutate({
      name,
      description,
      videoUrls: transformedVideos,
      categoryIds,
      variants: transformedVariants,
    });
  };

  // --- Page Protection ---
  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p>Loading session...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="flex h-64 items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
        <p>You must be an admin to view this page.</p>
      </div>
    );
  }

  // --- Render Form ---
  return (
    <div className="mx-auto max-w-4xl rounded-lg bg-gray-900 p-4 shadow-lg">
      <h1 className="mb-6 text-3xl font-bold text-gray-200">Add New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Product Info */}
        <div className="space-y-4 rounded-lg border border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-gray-300">
            Product Details
          </h2>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-400"
            >
              Product Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 p-2 text-gray-200 shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-400"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 p-2 text-gray-200 shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="videoUrls"
              className="block text-sm font-medium text-gray-400"
            >
              Video URLs (comma-separated)
            </label>
            <input
              id="videoUrls"
              type="text"
              value={videoUrls}
              onChange={(e) => setVideoUrls(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 p-2 text-gray-200 shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="categories"
              className="block text-sm font-medium text-gray-400"
            >
              Categories (Hold Ctrl/Cmd to select multiple)
            </label>
            {isLoadingCategories ? (
              <p>Loading categories...</p>
            ) : (
              <select
                id="categories"
                multiple
                value={categoryIds}
                onChange={handleCategoryChange}
                required
                className="mt-1 block h-32 w-full rounded-md border-gray-700 bg-gray-800 p-2 text-gray-200 shadow-sm"
              >
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Variants Section */}
        <div className="space-y-4 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-300">Variants</h2>
            <button
              type="button"
              onClick={addVariant}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add Variant
            </button>
          </div>

          {variants.length === 0 && (
            <p className="text-center text-gray-500">
              Click "Add Variant" to begin.
            </p>
          )}

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-4 rounded-lg border border-gray-600 p-3 md:grid-cols-2"
              >
                {/* Variant Fields */}
                <input
                  type="text"
                  placeholder="Variant Name (e.g., Red / M)"
                  value={variant.name}
                  onChange={(e) =>
                    handleVariantChange(index, "name", e.target.value)
                  }
                  required
                  className="rounded-md border-gray-700 bg-gray-800 p-2 text-gray-200"
                />
                <input
                  type="number"
                  placeholder="Price (e.g., 24.99)"
                  value={variant.price}
                  onChange={(e) =>
                    handleVariantChange(index, "price", e.target.value)
                  }
                  required
                  step="0.01"
                  min="0.01"
                  className="rounded-md border-gray-700 bg-gray-800 p-2 text-gray-200"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={variant.stock}
                  onChange={(e) =>
                    handleVariantChange(index, "stock", e.target.value)
                  }
                  required
                  step="1"
                  min="0"
                  className="rounded-md border-gray-700 bg-gray-800 p-2 text-gray-200"
                />
                <input
                  type="text"
                  placeholder="Images (comma-separated URLs)"
                  value={variant.images}
                  onChange={(e) =>
                    handleVariantChange(index, "images", e.target.value)
                  }
                  className="rounded-md border-gray-700 bg-gray-800 p-2 text-gray-200"
                />
                <textarea
                  placeholder='Options JSON, e.g., {"color": "Red", "size": "M"}'
                  value={variant.options}
                  onChange={(e) =>
                    handleVariantChange(index, "options", e.target.value)
                  }
                  required
                  rows={3}
                  className="rounded-md border-gray-700 bg-gray-800 p-2 text-gray-200 md:col-span-2"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="rounded-md bg-red-700 px-3 py-1 text-sm text-white hover:bg-red-800 md:col-span-2"
                >
                  Remove Variant
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Error and Submit */}
        {error && (
          <div className="rounded-md bg-red-900/50 p-3 text-red-400">
            {error}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={addProductMutation.isPending || isLoadingCategories}
            className="w-full rounded-md bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700 disabled:bg-gray-500"
          >
            {addProductMutation.isPending ? "Adding Product..." : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
