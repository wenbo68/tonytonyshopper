"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import type { Category } from "~/type";
import { FaImage, FaVideo } from "react-icons/fa";
import { MediaGrid, type MediaItem } from "./MediaGrid";

type VariantState = {
  id?: string;
  price: string;
  stock: string;
  options: string;
  images: MediaItem[];
  videos: MediaItem[];
};

type OptionValue = { id: string; name: string };
type OptionGroup = { id: string; name: string; values: OptionValue[] };

type ProductFormProps = {
  categories: Category[];
  productId?: string;
};

export default function ProductForm({
  categories,
  productId,
}: ProductFormProps) {
  const { data: session, status } = useSession();

  const { data: editedProduct, isFetching: isFetchingProduct } =
    api.product.getById.useQuery(
      { id: productId ?? "" },
      { enabled: !!productId },
    );

  // --- Initialize State ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([
    { id: crypto.randomUUID(), name: "", values: [] },
  ]);
  const [pendingValues, setPendingValues] = useState<Record<string, string>>(
    {},
  );

  // Sync state when editedProduct data arrives
  useEffect(() => {
    if (!editedProduct) return;

    setName(editedProduct.name);
    setDescription(editedProduct.description ?? "");
    setCategoryIds(
      editedProduct.productsToCategories.map((ptc) => ptc.categoryId),
    );

    const loadedVariants = editedProduct.variants.map((v) => {
      const sortedMedia = [...v.media].sort((a, b) => a.position - b.position);
      return {
        id: v.id,
        price: String(v.price),
        stock: String(v.stock),
        options: JSON.stringify(v.options ?? {}),
        images: sortedMedia
          .filter((m) => m.type === "image")
          .map((m) => ({ key: m.key, url: m.url })),
        videos: sortedMedia
          .filter((m) => m.type === "video")
          .map((m) => ({ key: m.key, url: m.url })),
      };
    });
    setVariants(loadedVariants);

    // Reconstruct Option Groups
    const groups: Record<string, Set<string>> = {};
    editedProduct.variants.forEach((v) => {
      const opts = (v.options as Record<string, string>) || {};
      Object.entries(opts).forEach(([key, val]) => {
        if (!groups[key]) groups[key] = new Set();
        groups[key]!.add(val);
      });
    });

    if (Object.keys(groups).length > 0) {
      const reconstructedGroups = Object.entries(groups).map(
        ([groupName, valueSet]) => ({
          id: crypto.randomUUID(),
          name: groupName,
          values: Array.from(valueSet).map((val) => ({
            id: crypto.randomUUID(),
            name: val,
          })),
        }),
      );
      setOptionGroups(reconstructedGroups);
    } else {
      setOptionGroups([{ id: crypto.randomUUID(), name: "", values: [] }]);
    }
  }, [editedProduct]);

  // --- Mutations ---
  const addProductMutation = api.admin.addProduct.useMutation({
    onSuccess: (data) => {
      alert(`Product "${name}" added with ID: ${data.id}`);
    },
    onError: (err) => {
      setError(`Failed to add product: ${err.message}`);
    },
  });

  const updateProductMutation = api.admin.updateProduct.useMutation({
    onSuccess: (data) => {
      alert(`Product "${name}" updated successfully!`);
    },
    onError: (err) => {
      setError(`Failed to update product: ${err.message}`);
    },
  });

  const isPending =
    addProductMutation.isPending || updateProductMutation.isPending;

  // --- Option Group Handlers ---
  const addOptionGroup = () => {
    setOptionGroups([
      ...optionGroups,
      { id: crypto.randomUUID(), name: "", values: [] },
    ]);
  };

  const removeOptionGroup = (id: string) => {
    setOptionGroups(optionGroups.filter((g) => g.id !== id));
    const newPending = { ...pendingValues };
    delete newPending[id];
    setPendingValues(newPending);
  };

  const updateOptionGroupName = (id: string, newName: string) => {
    setOptionGroups(
      optionGroups.map((g) => (g.id === id ? { ...g, name: newName } : g)),
    );
  };

  const addOptionValue = (groupId: string) => {
    const valName = pendingValues[groupId]?.trim();
    if (!valName) return;

    setOptionGroups(
      optionGroups.map((g) => {
        if (g.id === groupId) {
          if (g.values.some((v) => v.name === valName)) return g;
          return {
            ...g,
            values: [...g.values, { id: crypto.randomUUID(), name: valName }],
          };
        }
        return g;
      }),
    );
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

  // --- Variant Generation ---
  const generateVariants = () => {
    const validGroups = optionGroups.filter(
      (g) => g.name.trim() !== "" && g.values.length > 0,
    );

    if (validGroups.length === 0) {
      alert("Please add at least one Option Key and Value.");
      return;
    }

    const cartesian = (sets: OptionValue[][]) => {
      return sets.reduce<OptionValue[][]>(
        (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
        [[]],
      );
    };

    const combinations = cartesian(validGroups.map((g) => g.values));

    const newVariants: VariantState[] = combinations.map((combo) => {
      const optionsMap: Record<string, string> = {};

      combo.forEach((val, idx) => {
        const key = validGroups[idx]?.name ?? "Option";
        optionsMap[key] = val.name;
      });

      const jsonOptions = JSON.stringify(optionsMap);
      const existingVariant = variants.find((v) => v.options === jsonOptions);

      if (existingVariant) return existingVariant;

      return {
        id: undefined,
        price: "0",
        stock: "0",
        images: [],
        videos: [],
        options: jsonOptions,
      };
    });

    setVariants(newVariants);
  };

  // --- Variant Handlers ---
  const handleVariantChange = (
    index: number,
    field: keyof VariantState,
    value: any,
  ) => {
    setVariants((prev) => {
      const newVariants = [...prev];
      newVariants[index] = { ...newVariants[index]!, [field]: value };
      return newVariants;
    });
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // --- Submit ---
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

        const options = JSON.parse(v.options);

        return {
          id: v.id,
          price,
          stock,
          options,
          images: v.images,
          videos: v.videos,
        };
      });
    } catch (err) {
      setError("Invalid variant data. Check numbers.");
      return;
    }

    if (productId) {
      updateProductMutation.mutate({
        productId,
        name,
        description,
        categoryIds,
        variants: transformedVariants,
      });
    } else {
      addProductMutation.mutate({
        name,
        description,
        categoryIds,
        variants: transformedVariants,
      });
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );
    setCategoryIds(selectedOptions);
  };

  if (status === "loading" || isFetchingProduct)
    return (
      <div className="container mx-auto animate-pulse py-8 text-center">
        Loading...
      </div>
    );
  if (status === "unauthenticated" || session?.user?.role !== "admin")
    return (
      <div className="flex flex-col gap-0">
        <h2 className="text-center font-bold">Unauthorized</h2>
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-4xl flex-col gap-8 pb-20 text-sm"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {productId ? "Edit Product" : "Add Product"}
        </h1>
        {productId && (
          <span className="font-mono text-xs text-gray-500">
            ID: {productId}
          </span>
        )}
      </div>

      {/* Basic Info Block */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        {/* ... (Name, Categories, Description inputs remain the same) ... */}
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

      {/* Options Configuration Block - Unchanged except for brevity in this response */}
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
        <div className="flex flex-col gap-4">
          {optionGroups.map((group) => (
            <div
              key={group.id}
              className="flex flex-col gap-2 rounded border border-gray-700 bg-gray-900/50 p-3"
            >
              <div className="flex flex-col items-end gap-3 md:flex-row md:items-center">
                <div className="flex w-full flex-col gap-1 md:w-1/3">
                  <label className="font-mono text-xs text-gray-400">
                    Option Name
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
                    Add Value
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
              <div className="mt-1 flex flex-wrap gap-2">
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
          Generate/Update Variants from Options
        </button>
      </div>

      {/* Variants List */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        <h2 className="border-b border-gray-700 pb-2 text-lg font-bold text-gray-200">
          Variants ({variants.length})
        </h2>

        <div className="flex flex-col gap-6">
          {variants.map((variant, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded border border-gray-700 bg-gray-900 p-4 shadow-sm"
            >
              {/* Variant Header & Price/Stock fields remain unchanged */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-gray-500">
                    {variant.options}
                  </span>
                  {variant.id && (
                    <span className="ml-2 rounded bg-gray-800 px-1 text-[10px] text-gray-500">
                      Existing ID: {variant.id}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-sm text-red-500 hover:text-red-400"
                >
                  Remove Variant
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    step="0.01"
                    min={0.01}
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
                    min={0}
                  />
                </div>
              </div>

              {/* --- MEDIA SECTIONS USING MediaGrid --- */}
              <MediaGrid
                mediaType="image"
                maxItems={8}
                items={variant.images}
                onChange={(newItems) =>
                  handleVariantChange(index, "images", newItems)
                }
                uploadThingRoute="variantImageUploader"
                title={
                  <span className="flex items-center gap-2">
                    <FaImage /> Images (Drag to reorder)
                  </span>
                }
              />

              <MediaGrid
                mediaType="video"
                maxItems={1}
                items={variant.videos}
                onChange={(newItems) =>
                  handleVariantChange(index, "videos", newItems)
                }
                uploadThingRoute="variantVideoUploader"
                title={
                  <span className="flex items-center gap-2">
                    <FaVideo /> Video
                  </span>
                }
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-800 bg-red-900/50 p-3 text-red-200">
          {error}
        </div>
      )}

      <div className="sticky bottom-4 z-10">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-green-600 px-6 py-4 font-bold text-white shadow-lg transition-transform hover:bg-green-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-600"
        >
          {isPending
            ? "Saving..."
            : productId
              ? "Update Product"
              : "Create Product"}
        </button>
      </div>
    </form>
  );
}
