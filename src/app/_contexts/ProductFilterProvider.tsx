"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useSessionStorageState } from "../_hooks/useSessionStorage";

// Define the context type
type ProductFilterContextType = {
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  category: string[];
  setCategory: Dispatch<SetStateAction<string[]>>;
  minPrice: string;
  setminPrice: Dispatch<SetStateAction<string>>;
  maxPrice: string;
  setmaxPrice: Dispatch<SetStateAction<string>>;
  ratingMin: string;
  setRatingMin: Dispatch<SetStateAction<string>>;
  ratingMax: string;
  setRatingMax: Dispatch<SetStateAction<string>>;
  stock: string[];
  setStock: Dispatch<SetStateAction<string[]>>;
  order: string;
  setOrder: Dispatch<SetStateAction<string>>;
  handleSearch: (
    overrides?: Partial<{
      name: string;
      categories: string[];
      minPrice: string;
      maxPrice: string;
      ratingMin: string;
      ratingMax: string;
      stock: string[];
      order: string;
    }>,
  ) => void;
};

const ProductFilterContext = createContext<
  ProductFilterContextType | undefined
>(undefined);

export function useProductFilterContext() {
  const context = useContext(ProductFilterContext);
  if (context === undefined) {
    throw new Error(
      "useProductFilterContext must be used within a ProductFilterProvider",
    );
  }
  return context;
}

export function ProductFilterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. use states for instant highlight on selected filter options
  const [name, setName] = useState(() => searchParams.get("name") ?? "");
  const [category, setCategory] = useState(() =>
    searchParams.getAll("category"),
  );
  const [minPrice, setminPrice] = useState(
    () => searchParams.get("minPrice") ?? "",
  );
  const [maxPrice, setmaxPrice] = useState(
    () => searchParams.get("maxPrice") ?? "",
  );
  const [ratingMin, setRatingMin] = useState(
    () => searchParams.get("ratingMin") ?? "",
  );
  const [ratingMax, setRatingMax] = useState(
    () => searchParams.get("ratingMax") ?? "",
  );
  const [stock, setStock] = useState(() => searchParams.getAll("stock"));
  const [order, setOrder] = useSessionStorageState(
    "order",
    searchParams.get("order") ?? "",
  );

  // 2. sync url to states
  useEffect(() => {
    setName(searchParams.get("name") ?? "");
    setCategory(searchParams.getAll("category"));
    setminPrice(searchParams.get("minPrice") ?? "");
    setmaxPrice(searchParams.get("maxPrice") ?? "");
    setRatingMin(searchParams.get("ratingMin") ?? "");
    setRatingMax(searchParams.get("ratingMax") ?? "");
    setStock(searchParams.getAll("stock"));
    setOrder(searchParams.get("order") ?? "");
  }, [searchParams]);

  // 3. sync state (or arbitrary value) to url
  type SearchParamsOverride = Partial<{
    name: string;
    categories: string[];
    minPrice: string;
    maxPrice: string;
    ratingMin: string;
    ratingMax: string;
    stock: string[];
    order: string;
  }>;

  const handleSearch = (overrides: SearchParamsOverride = {}) => {
    const newParams = new URLSearchParams();

    // Use overrides if provided, otherwise fall back to state
    // const finalRating = overrides.rating ?? rating;
    const finalName = overrides.name ?? name;
    const finalCategories = overrides.categories ?? category;
    const finalminPrice = overrides.minPrice ?? minPrice;
    const finalmaxPrice = overrides.maxPrice ?? maxPrice;
    const finalRatingMin = overrides.ratingMin ?? ratingMin;
    const finalRatingMax = overrides.ratingMax ?? ratingMax;
    const finalStock = overrides.stock ?? stock;
    const finalOrder = overrides.order ?? order;

    // finalRating.forEach((v) => newParams.append("rating", v));
    if (finalName) newParams.set("name", finalName);
    finalCategories.forEach((v) => newParams.append("category", v));
    if (finalminPrice) newParams.set("minPrice", finalminPrice);
    if (finalmaxPrice) newParams.set("maxPrice", finalmaxPrice);
    if (finalRatingMin) newParams.set("ratingMin", finalRatingMin);
    if (finalRatingMax) newParams.set("ratingMax", finalRatingMax);
    finalStock.forEach((v) => newParams.append("stock", v));
    if (finalOrder) {
      newParams.set("order", finalOrder);
    } else {
      setOrder("created-desc");
      newParams.set("order", "created-desc");
    }

    // Always reset to page 1 for a new search
    newParams.set("page", "1");

    const url = `/product/all?${newParams.toString()}#product-filters`;
    router.push(url);
  };

  const value = {
    name,
    setName,
    category,
    setCategory,
    minPrice,
    setminPrice,
    maxPrice,
    setmaxPrice,
    ratingMin,
    setRatingMin,
    ratingMax,
    setRatingMax,
    stock,
    setStock,
    order,
    setOrder,
    handleSearch,
  };

  return (
    <ProductFilterContext.Provider value={value}>
      {children}
    </ProductFilterContext.Provider>
  );
}
