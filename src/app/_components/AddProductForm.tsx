"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import type { Category } from "~/type";
import { MultiUploader } from "./MultiUploader";

// Define the shape of a variant based on your admin router's input
type VariantState = {
  name: string;
  price: string; // Use string for form input
  stock: string; // Use string for form input
  images: string; // Comma-separated URLs
  options: string; // JSON string, e.g., {"color": "Red", "size": "M"}
};

// Helper types for Option generation
type OptionValue = { id: string; name: string };
type OptionGroup = { id: string; name: string; values: OptionValue[] };

export default function AddProductForm({
  categories,
}: {
  categories: Category[];
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrls, setVideoUrls] = useState(""); // Comma-separated URLs
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantState[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Options State
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([
    { id: crypto.randomUUID(), name: "", values: [] },
  ]);
  // Temporary state for the "value" input field of each group
  const [pendingValues, setPendingValues] = useState<Record<string, string>>(
    {},
  );

  const addProductMutation = api.admin.addProduct.useMutation({
    onSuccess: (data) => {
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

  // --- Option Group Handlers ---
  const addOptionGroup = () => {
    setOptionGroups([
      ...optionGroups,
      { id: crypto.randomUUID(), name: "", values: [] },
    ]);
  };

  const removeOptionGroup = (id: string) => {
    setOptionGroups(optionGroups.filter((g) => g.id !== id));
    // Clean up pending value state
    const newPending = { ...pendingValues };
    delete newPending[id];
    setPendingValues(newPending);
  };

  const updateOptionGroupName = (id: string, newName: string) => {
    setOptionGroups(
      optionGroups.map((g) => (g.id === id ? { ...g, name: newName } : g)),
    );
  };

  // --- Option Value Handlers ---
  const addOptionValue = (groupId: string) => {
    const valName = pendingValues[groupId]?.trim();
    if (!valName) return;

    setOptionGroups(
      optionGroups.map((g) => {
        if (g.id === groupId) {
          // Prevent duplicates
          if (g.values.some((v) => v.name === valName)) return g;
          return {
            ...g,
            values: [...g.values, { id: crypto.randomUUID(), name: valName }],
          };
        }
        return g;
      }),
    );
    // Clear input
    setPendingValues({ ...pendingValues, [groupId]: "" });
  };

  const removeOptionValue = (groupId: string, valueId: string) => {
    setOptionGroups(
      optionGroups.map((g) => {
        if (g.id === groupId) {
          return { ...g, values: g.values.filter((v) => v.id !== valueId) };
        }
        return g;
      }),
    );
  };

  // --- Variant Generation Logic ---
  const generateVariants = () => {
    // 1. Filter out incomplete groups
    const validGroups = optionGroups.filter(
      (g) => g.name.trim() !== "" && g.values.length > 0,
    );

    if (validGroups.length === 0) {
      alert(
        "Please add at least one Option Key (e.g. Color) and one Value (e.g. Red).",
      );
      return;
    }

    // 2. Cartesian Product Helper
    const cartesian = (sets: OptionValue[][]) => {
      return sets.reduce<OptionValue[][]>(
        (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
        [[]],
      );
    };

    const combinations = cartesian(validGroups.map((g) => g.values));

    // 3. Create Variant Objects (Preserving existing data)
    const newVariants: VariantState[] = combinations.map((combo) => {
      const optionsMap: Record<string, string> = {};
      const nameParts: string[] = [];

      combo.forEach((val, idx) => {
        const key = validGroups[idx]?.name ?? "Option";
        optionsMap[key] = val.name;
        nameParts.push(val.name);
      });

      const jsonOptions = JSON.stringify(optionsMap);

      // Check if this variant already exists in the current state
      // We match based on the `options` JSON string to ensure exact option match
      const existingVariant = variants.find((v) => v.options === jsonOptions);

      if (existingVariant) {
        return existingVariant;
      }

      return {
        name: nameParts.join(" / "),
        price: "0",
        stock: "0",
        images: "",
        options: jsonOptions,
      };
    });

    setVariants(newVariants);
  };

  // --- Variant Field Handlers ---
  const handleVariantChange = (
    index: number,
    field: keyof VariantState,
    value: string,
  ) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index]!, [field]: value };
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );
    setCategoryIds(selectedOptions);
  };

  // --- Submit Handler ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (variants.length === 0) {
      setError("You must add at least one product variant.");
      return;
    }
    if (categoryIds.length === 0) {
      setError("You must select at least one category.");
      return;
    }

    let transformedVariants;
    try {
      transformedVariants = variants.map((v) => {
        const price = parseFloat(v.price);
        const stock = parseInt(v.stock, 10);
        if (isNaN(price) || isNaN(stock)) throw new Error("Invalid number");

        const images =
          v.images.trim() === ""
            ? []
            : v.images.split(",").map((u) => u.trim());
        const options = JSON.parse(v.options);

        return { name: v.name, price, stock, images, options };
      });
    } catch (err) {
      setError("Invalid variant data. Check JSON format and numbers.");
      return;
    }

    const transformedVideos =
      videoUrls.trim() === "" ? [] : videoUrls.split(",").map((u) => u.trim());

    addProductMutation.mutate({
      name,
      description,
      videoUrls: transformedVideos,
      categoryIds,
      variants: transformedVariants,
    });
  };

  if (status === "loading")
    return <div className="text-center">Loading...</div>;
  if (status === "unauthenticated" || session?.user?.role !== "admin")
    return <div className="text-center">Unauthorized.</div>;

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-4xl flex-col gap-8 pb-20 text-sm"
    >
      {/* 1. Basic Info */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        <h2 className="border-b border-gray-700 pb-2 text-lg font-bold text-gray-200">
          Basic Info
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="font-semibold text-gray-300">
              Product Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded border border-gray-700 bg-gray-900 p-2 outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="categories" className="font-semibold text-gray-300">
              Categories
            </label>
            <select
              id="categories"
              multiple
              value={categoryIds}
              onChange={handleCategoryChange}
              required
              className="scrollbar-thin h-[42px] rounded border border-gray-700 bg-gray-900 p-2 outline-none focus:border-blue-500"
            >
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="font-semibold text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded border border-gray-700 bg-gray-900 p-2 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 2. Options Configuration */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        <div className="flex items-center justify-between border-b border-gray-700 pb-2">
          <h2 className="text-lg font-bold text-gray-200">Options</h2>
          <button
            type="button"
            onClick={addOptionGroup}
            className="text-xs font-semibold text-blue-400 uppercase hover:text-blue-300"
          >
            + Add Option Key
          </button>
        </div>

        <div id="options" className="flex flex-col gap-4">
          {optionGroups.map((group, index) => (
            <div
              key={group.id}
              className="flex flex-col gap-2 rounded border border-gray-700 bg-gray-900/50 p-3"
            >
              {/* Top Row: Key Name & Add Value Input */}
              <div className="flex flex-col items-end gap-3 md:flex-row md:items-center">
                <div className="flex w-full flex-col gap-1 md:w-1/3">
                  <label className="font-mono text-xs text-gray-400">
                    Option Name (e.g. Color)
                  </label>
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) =>
                      updateOptionGroupName(group.id, e.target.value)
                    }
                    placeholder="Color"
                    className="w-full rounded border border-gray-600 bg-gray-800 p-2 text-white outline-none"
                  />
                </div>

                <div className="flex w-full flex-col gap-1 md:w-1/3">
                  <label className="font-mono text-xs text-gray-400">
                    Add Value (e.g. Red)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pendingValues[group.id] || ""}
                      onChange={(e) =>
                        setPendingValues({
                          ...pendingValues,
                          [group.id]: e.target.value,
                        })
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addOptionValue(group.id))
                      }
                      placeholder="Red"
                      className="flex-1 rounded border border-gray-600 bg-gray-800 p-2 text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => addOptionValue(group.id)}
                      className="rounded bg-gray-700 px-3 text-white hover:bg-gray-600"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => removeOptionGroup(group.id)}
                    className="text-xs text-red-500 underline hover:text-red-400"
                  >
                    Remove Option
                  </button>
                </div>
              </div>

              {/* Bottom Row: Chips for added values */}
              <div className="mt-1 flex flex-wrap gap-2">
                {group.values.length === 0 && (
                  <span className="text-xs text-gray-500 italic">
                    No values added yet.
                  </span>
                )}
                {group.values.map((val) => (
                  <span
                    key={val.id}
                    className="inline-flex items-center gap-1 rounded border border-blue-800 bg-blue-900/30 px-2 py-1 text-sm text-blue-200"
                  >
                    {val.name}
                    <button
                      type="button"
                      onClick={() => removeOptionValue(group.id, val.id)}
                      className="ml-1 text-blue-400 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={generateVariants}
          className="mt-2 w-full rounded border border-dashed border-gray-600 p-3 text-gray-400 transition-colors hover:border-gray-400 hover:bg-gray-800 hover:text-white"
        >
          Generate Variants from Options
        </button>
      </div>

      {/* 3. Variants List */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        <h2 className="border-b border-gray-700 pb-2 text-lg font-bold text-gray-200">
          Variants ({variants.length})
        </h2>

        {variants.length === 0 && (
          <p className="py-4 text-center text-gray-500">
            No variants generated yet.
          </p>
        )}

        <div id="variants" className="flex flex-col gap-4">
          {variants.map((variant, index) => (
            <div
              key={index}
              className="group relative flex flex-col gap-3 rounded border border-gray-700 bg-gray-900 p-4"
            >
              {/* Header with Name & Remove */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white">
                    {variant.name}
                  </span>
                  <span className="font-mono text-xs text-gray-500">
                    {variant.options}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-sm text-red-500 hover:text-red-400"
                >
                  Remove
                </button>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">
                    Price
                  </label>
                  <input
                    type="number"
                    value={variant.price}
                    onChange={(e) =>
                      handleVariantChange(index, "price", e.target.value)
                    }
                    className="rounded border border-gray-600 bg-gray-800 p-2 text-white outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={variant.stock}
                    onChange={(e) =>
                      handleVariantChange(index, "stock", e.target.value)
                    }
                    className="rounded border border-gray-600 bg-gray-800 p-2 text-white outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Placeholder Buttons for future features */}
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  className="rounded border border-gray-600 bg-gray-800 px-3 py-1 text-xs text-gray-300 hover:bg-gray-700"
                >
                  + Upload Images
                </button>
                <button
                  type="button"
                  className="rounded border border-gray-600 bg-gray-800 px-3 py-1 text-xs text-gray-300 hover:bg-gray-700"
                >
                  + Add Video
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-800 bg-red-900/50 p-3 text-red-200">
          {error}
        </div>
      )}

      <div className="sticky bottom-4">
        <button
          type="submit"
          disabled={addProductMutation.isPending}
          className="w-full rounded-md bg-green-600 px-6 py-4 font-bold text-white shadow-lg transition-transform hover:bg-green-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-600"
        >
          {addProductMutation.isPending ? "Adding Product..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}
