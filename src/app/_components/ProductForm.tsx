"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import type { Category } from "~/type";
import { MultiUploader } from "./MultiUploader";
import { FaTrash, FaGripVertical, FaVideo, FaImage } from "react-icons/fa";

// 1. Types
type MediaItem = {
  key: string;
  url: string;
};

type VariantState = {
  id?: string; // Added for Edit mode
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

  // Initialize Variants from Initial Data
  const [variants, setVariants] = useState<VariantState[]>([]);

  const [error, setError] = useState<string | null>(null);

  // Initialize Option Groups from Initial Data (Reconstruction)
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([
    { id: crypto.randomUUID(), name: "", values: [] },
  ]);

  const [pendingValues, setPendingValues] = useState<Record<string, string>>(
    {},
  );

  // Sync state when editedProduct data arrives
  useEffect(() => {
    if (!editedProduct) return;

    // 1. Basic Info
    setName(editedProduct.name);
    setDescription(editedProduct.description ?? "");
    setCategoryIds(
      editedProduct.productsToCategories.map((ptc) => ptc.categoryId),
    );

    // 2. Reconstruct Variants
    const loadedVariants = editedProduct.variants.map((v) => {
      const sortedMedia = [...v.media].sort((a, b) => a.position - b.position);
      return {
        id: v.id,
        price: String(v.price), // Ensure string for input
        stock: String(v.stock), // Ensure string for input
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

    // 3. Reconstruct Option Groups
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
      // Reset to default if no options exist
      setOptionGroups([{ id: crypto.randomUUID(), name: "", values: [] }]);
    }
  }, [editedProduct]);

  // Drag and Drop state
  const [draggedItem, setDraggedItem] = useState<{
    variantIndex: number;
    mediaType: "image" | "video";
    mediaIndex: number;
  } | null>(null);

  // --- Mutations ---
  const utils = api.useUtils();

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

  // const deleteMediaMutation = api.admin.deleteMedia.useMutation({
  //   onError: (err) => {
  //     console.error("Failed to delete media from UploadThing:", err);
  //   },
  // });

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

      // Check if this variant already exists (to preserve ID, Price, Stock, Media)
      const existingVariant = variants.find((v) => v.options === jsonOptions);

      if (existingVariant) return existingVariant;

      return {
        id: undefined, // New variant
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
    value: string,
  ) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index]!, [field]: value };
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // --- Media Handlers ---
  const addMediaToVariant = (
    index: number,
    newMedia: { key: string; url: string }[],
    type: "image" | "video",
  ) => {
    setVariants((prev) => {
      const newVariants = [...prev];
      const variant = newVariants[index]!;

      if (type === "image") {
        if (variant.images.length + newMedia.length > 8) {
          alert("Max 8 images allowed per variant.");
          return prev;
        }
        newVariants[index] = {
          ...variant,
          images: [...variant.images, ...newMedia],
        };
      } else {
        if (variant.videos.length + newMedia.length > 1) {
          alert("Max 1 video allowed per variant.");
          return prev;
        }
        newVariants[index] = {
          ...variant,
          videos: [...variant.videos, ...newMedia],
        };
      }
      return newVariants;
    });
  };

  const removeMedia = (
    variantIndex: number,
    mediaIndex: number,
    type: "image" | "video",
  ) => {
    const variant = variants[variantIndex]!;
    const mediaItem =
      type === "image"
        ? variant.images[mediaIndex]
        : variant.videos[mediaIndex];

    // if (mediaItem?.key) {
    //   deleteMediaMutation.mutate({ key: mediaItem.key });
    // }

    setVariants((prev) => {
      const newVariants = [...prev];
      const currVariant = newVariants[variantIndex]!;

      if (type === "image") {
        newVariants[variantIndex] = {
          ...currVariant,
          images: currVariant.images.filter((_, i) => i !== mediaIndex),
        };
      } else {
        newVariants[variantIndex] = {
          ...currVariant,
          videos: currVariant.videos.filter((_, i) => i !== mediaIndex),
        };
      }
      return newVariants;
    });
  };

  // --- Drag and Drop Logic ---
  const onDragStart = (
    e: React.DragEvent,
    variantIndex: number,
    mediaType: "image" | "video",
    mediaIndex: number,
  ) => {
    setDraggedItem({ variantIndex, mediaType, mediaIndex });
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (
    e: React.DragEvent,
    targetVariantIndex: number,
    targetMediaType: "image" | "video",
    targetMediaIndex: number,
  ) => {
    e.preventDefault();

    if (!draggedItem) return;
    const {
      variantIndex: sourceVariantIndex,
      mediaType: sourceMediaType,
      mediaIndex: sourceMediaIndex,
    } = draggedItem;

    if (sourceVariantIndex !== targetVariantIndex) return;
    if (sourceMediaType !== targetMediaType) return;
    if (sourceMediaIndex === targetMediaIndex) return;

    setVariants((prev) => {
      const newVariants = [...prev];
      const variant = newVariants[sourceVariantIndex]!;
      let list =
        sourceMediaType === "image" ? [...variant.images] : [...variant.videos];

      const [movedItem] = list.splice(sourceMediaIndex, 1);
      if (movedItem) {
        list.splice(targetMediaIndex, 0, movedItem);
      }

      newVariants[sourceVariantIndex] = {
        ...variant,
        images: sourceMediaType === "image" ? list : variant.images,
        videos: sourceMediaType === "video" ? list : variant.videos,
      };

      return newVariants;
    });

    setDraggedItem(null);
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
          id: v.id, // Include ID for updates
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
      // Update Mode
      updateProductMutation.mutate({
        productId,
        name,
        description,
        categoryIds,
        variants: transformedVariants,
      });
    } else {
      // Create Mode
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

      {/* Options Configuration Block */}
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
              {/* Variant Header */}
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

              {/* Price & Stock */}
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

              {/* --- IMAGE SECTION --- */}
              <div className="flex flex-col gap-2 rounded bg-gray-800/50 p-3">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    <FaImage /> Images (Drag to reorder)
                  </h3>
                  <span className="text-[10px] text-gray-500">
                    {variant.images.length}/8
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {variant.images.map((item, imgIndex) => (
                    <div
                      key={item.key}
                      draggable
                      onDragStart={(e) =>
                        onDragStart(e, index, "image", imgIndex)
                      }
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, index, "image", imgIndex)}
                      className="relative flex aspect-square cursor-grab flex-col items-center justify-center overflow-hidden rounded border border-gray-600 bg-gray-800 active:cursor-grabbing"
                    >
                      <img
                        src={item.url}
                        alt="Variant"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                        <FaGripVertical className="text-white drop-shadow-md" />
                      </div>
                      <div className="absolute top-1 right-1">
                        <button
                          type="button"
                          onClick={() => removeMedia(index, imgIndex, "image")}
                          className="rounded-full bg-red-600 p-1 text-white hover:bg-red-500"
                        >
                          <FaTrash size={10} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Image Uploader Button */}
                  {variant.images.length < 8 && (
                    <div className="col-span-1">
                      <MultiUploader
                        label="+"
                        uploadThingRoute="variantImageUploader"
                        availability={8 - variant.images.length}
                        onUploadSuccess={(files) =>
                          addMediaToVariant(index, files, "image")
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* --- VIDEO SECTION --- */}
              <div className="flex flex-col gap-2 rounded bg-gray-800/50 p-3">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    <FaVideo /> Video
                  </h3>
                  <span className="text-[10px] text-gray-500">
                    {variant.videos.length}/1
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {variant.videos.map((item, vidIndex) => (
                    <div
                      key={item.key}
                      draggable
                      onDragStart={(e) =>
                        onDragStart(e, index, "video", vidIndex)
                      }
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, index, "video", vidIndex)}
                      className="relative flex aspect-square cursor-grab flex-col items-center justify-center overflow-hidden rounded border border-gray-600 bg-gray-800 active:cursor-grabbing"
                    >
                      <div className="flex h-full w-full items-center justify-center bg-black">
                        <FaVideo className="text-3xl text-gray-500" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                        <FaGripVertical className="text-white drop-shadow-md" />
                      </div>
                      <div className="absolute top-1 right-1">
                        <button
                          type="button"
                          onClick={() => removeMedia(index, vidIndex, "video")}
                          className="rounded-full bg-red-600 p-1 text-white hover:bg-red-500"
                        >
                          <FaTrash size={10} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Video Uploader Button */}
                  {variant.videos.length < 1 && (
                    <div className="col-span-1">
                      <MultiUploader
                        label="+"
                        uploadThingRoute="variantVideoUploader"
                        availability={1 - variant.videos.length}
                        onUploadSuccess={(files) =>
                          addMediaToVariant(index, files, "video")
                        }
                      />
                    </div>
                  )}
                </div>
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
