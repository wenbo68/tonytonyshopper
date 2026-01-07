"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import type { Category } from "~/type";
import { FaImage, FaTrash, FaVideo } from "react-icons/fa";
import { MediaGrid, type MediaItem } from "./MediaGrid";
import { Dropdown } from "./Dropdown";
import { ClickablePill, PillContainer, UnclickablePill } from "./Pill";
import { FaCheck, FaListUl } from "react-icons/fa6";
import type { colorClassMap } from "~/const";

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

  // Option State
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [inputOptionName, setInputOptionName] = useState("");
  const [inputOptionValue, setInputOptionValue] = useState("");

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
      setOptionGroups([]);
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

  // --- Option Handlers ---

  const handleAddOption = () => {
    const optName = inputOptionName.trim();
    const optValue = inputOptionValue.trim();

    if (!optName || !optValue) return;

    setOptionGroups((prev) => {
      const existingGroupIndex = prev.findIndex((g) => g.name === optName);

      if (existingGroupIndex !== -1) {
        // Group exists, append value if not present
        const group = prev[existingGroupIndex]!;
        if (group.values.some((v) => v.name === optValue)) return prev;

        const updatedGroup = {
          ...group,
          values: [
            ...group.values,
            { id: crypto.randomUUID(), name: optValue },
          ],
        };
        const newGroups = [...prev];
        newGroups[existingGroupIndex] = updatedGroup;
        return newGroups;
      } else {
        // Create new group
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: optName,
            values: [{ id: crypto.randomUUID(), name: optValue }],
          },
        ];
      }
    });

    // Clear value input so user can quickly add another value for the same key
    setInputOptionValue("");
  };

  const handleRemoveOptionValue = (groupId: string, valueId: string) => {
    setOptionGroups((prev) =>
      prev
        .map((g) => {
          if (g.id === groupId) {
            return { ...g, values: g.values.filter((v) => v.id !== valueId) };
          }
          return g;
        })
        .filter((g) => g.values.length > 0),
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

  // --- Category Handlers ---
  const handleClickCategory = (catId: string) => {
    if (!categoryIds.includes(catId)) {
      setCategoryIds([...categoryIds, catId]);
    } else {
      setCategoryIds(categoryIds.filter((id) => id !== catId));
    }
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
      <div className="flex flex-col gap-3">
        {/* Product Info */}
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Product Category</span>
          <div className="flex flex-col gap-3">
            <Dropdown
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              value={categoryIds}
              onChange={handleClickCategory}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="font-semibold">
            Product Name
          </label>
          <input
            id="name"
            type="text"
            // placeholder="Enter name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded bg-gray-900 px-3 py-2 outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="font-semibold">
            Product Description
          </label>
          <textarea
            id="description"
            // placeholder="Enter description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={1}
            className="scrollbar-hide rounded bg-gray-900 px-3 py-2 outline-none"
          />
        </div>

        {/* <hr className="border-gray-800" /> */}

        {/* Options */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
          <div className="flex w-full items-end gap-2">
            <div className="flex w-full flex-col gap-1">
              <label className="font-semibold">Option Name</label>
              <input
                type="text"
                value={inputOptionName}
                onChange={(e) => setInputOptionName(e.target.value)}
                // placeholder="e.g. Color"
                className="rounded bg-gray-900 px-3 py-2 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddOption}
              className="flex aspect-square min-w-9 cursor-pointer items-center justify-center rounded bg-indigo-600 font-semibold text-gray-300 hover:bg-indigo-700 disabled:hover:cursor-default disabled:hover:bg-indigo-600 sm:hidden"
            >
              <FaCheck />
            </button>
          </div>
          <div className="flex w-full items-end gap-2">
            <div className="flex w-full flex-col gap-1">
              <label className="font-semibold">Option Value</label>
              <input
                type="text"
                value={inputOptionValue}
                onChange={(e) => setInputOptionValue(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddOption())
                }
                // placeholder="e.g. Red"
                className="rounded bg-gray-900 px-3 py-2 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={generateVariants}
              className="flex aspect-square min-w-9 cursor-pointer items-center justify-center rounded bg-indigo-600 font-semibold text-gray-300 hover:bg-indigo-700 disabled:hover:cursor-default disabled:hover:bg-indigo-600 sm:hidden"
            >
              <FaListUl />
            </button>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={handleAddOption}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded bg-indigo-600 font-semibold text-gray-300 hover:bg-indigo-700 disabled:hover:cursor-default disabled:hover:bg-indigo-600"
            >
              <FaCheck />
            </button>
            <button
              type="button"
              onClick={generateVariants}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded bg-indigo-600 font-semibold text-gray-300 hover:bg-indigo-700 disabled:hover:cursor-default disabled:hover:bg-indigo-600"
            >
              <FaListUl />
            </button>
          </div>
        </div>
        {optionGroups.length === 0 ? null : (
          <div className="flex flex-col gap-2">
            {optionGroups.map((group, index) => (
              <PillContainer key={group.id}>
                {group.values.map((val) => (
                  <ClickablePill
                    key={val.id}
                    label={`${group.name}: ${val.name}`}
                    color={
                      (index < 8
                        ? index + 1
                        : "gray") as keyof typeof colorClassMap
                    }
                    onRemove={() => handleRemoveOptionValue(group.id, val.id)}
                  />
                ))}
              </PillContainer>
            ))}
          </div>
        )}

        {/* <hr className="border-gray-800" /> */}

        {/* Variants */}
        {variants.map((variant, index) => (
          <div key={index} className="flex flex-col gap-3">
            <hr className="mt-2 border-gray-800" />

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">Variant {index + 1}:</span>
                <PillContainer>
                  {Object.entries(
                    JSON.parse(variant.options) as Record<string, string>,
                  ).map(([optName, optValue]) => {
                    const groupIndex = optionGroups.findIndex(
                      (g) => g.name === optName,
                    );
                    const color =
                      groupIndex !== -1 && groupIndex < 8
                        ? groupIndex + 1
                        : "gray";

                    return (
                      <UnclickablePill
                        key={optName}
                        label={`${optName}: ${optValue}`}
                        color={color as keyof typeof colorClassMap}
                      />
                    );
                  })}
                </PillContainer>
              </div>
              {/* <button
                type="button"
                onClick={() => removeVariant(index)}
                className="flex cursor-pointer items-center justify-center rounded-full bg-red-600/50 p-1.5 text-gray-300 hover:bg-red-600/80"
              >
                <FaTrash size={10} />
              </button> */}
            </div>

            <div className="flex gap-2">
              <div className="flex w-full flex-col gap-1">
                <label
                  htmlFor={`variant-${index}-price`}
                  className="font-semibold"
                >
                  Variant Price
                </label>
                <input
                  id={`variant-${index}-price`}
                  type="number"
                  value={variant.price}
                  onChange={(e) =>
                    handleVariantChange(index, "price", e.target.value)
                  }
                  className="w-full rounded bg-gray-900 px-3 py-2 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  min={0.01}
                />
              </div>
              <div className="flex w-full flex-col gap-1">
                <label
                  htmlFor={`variant-${index}-stock`}
                  className="font-semibold"
                >
                  Variant Stock
                </label>
                <input
                  id={`variant-${index}-stock`}
                  type="number"
                  value={variant.stock}
                  onChange={(e) =>
                    handleVariantChange(index, "stock", e.target.value)
                  }
                  className="w-full rounded bg-gray-900 px-3 py-2 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
            />

            <MediaGrid
              mediaType="video"
              maxItems={1}
              items={variant.videos}
              onChange={(newItems) =>
                handleVariantChange(index, "videos", newItems)
              }
              uploadThingRoute="variantVideoUploader"
            />
          </div>
        ))}

        {/* Submit button */}
        <hr className="my-2 border-gray-800" />
        {error && <span className="text-red-600/50">{error}</span>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded bg-indigo-600 px-4 py-2 font-semibold text-gray-300 transition-colors hover:bg-indigo-700 disabled:cursor-default disabled:bg-gray-600"
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
