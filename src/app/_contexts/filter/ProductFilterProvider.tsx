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
import { useSessionStorageState } from "../../_hooks/useSessionStorage";
import { defaultProductSort } from "~/const";

type Overrides = Partial<{
  name: string;
  categories: string[];
  priceMin: string;
  priceMax: string;
  ratingMin: string;
  ratingMax: string;
  stock: string[];
  sort: string;
}>;

// Define the context type
type ProductFilterContextType = {
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  category: string[];
  setCategory: Dispatch<SetStateAction<string[]>>;
  priceMin: string;
  setPriceMin: Dispatch<SetStateAction<string>>;
  priceMax: string;
  setPriceMax: Dispatch<SetStateAction<string>>;
  ratingMin: string;
  setRatingMin: Dispatch<SetStateAction<string>>;
  ratingMax: string;
  setRatingMax: Dispatch<SetStateAction<string>>;
  stock: string[];
  setStock: Dispatch<SetStateAction<string[]>>;
  sort: string;
  setSort: Dispatch<SetStateAction<string>>;
  handleSearch: (overrides?: Overrides) => void;
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
  const [priceMin, setPriceMin] = useState(
    () => searchParams.get("priceMin") ?? "",
  );
  const [priceMax, setPriceMax] = useState(
    () => searchParams.get("priceMax") ?? "",
  );
  const [ratingMin, setRatingMin] = useState(
    () => searchParams.get("ratingMin") ?? "",
  );
  const [ratingMax, setRatingMax] = useState(
    () => searchParams.get("ratingMax") ?? "",
  );
  const [stock, setStock] = useState(() => searchParams.getAll("stock"));
  const [sort, setSort] = useSessionStorageState(
    "product-sort",
    searchParams.get("sort") ?? defaultProductSort,
  );

  // 2. sync url to states
  useEffect(() => {
    setName(searchParams.get("name") ?? "");
    setCategory(searchParams.getAll("category"));
    setPriceMin(searchParams.get("priceMin") ?? "");
    setPriceMax(searchParams.get("priceMax") ?? "");
    setRatingMin(searchParams.get("ratingMin") ?? "");
    setRatingMax(searchParams.get("ratingMax") ?? "");
    setStock(searchParams.getAll("stock"));
    setSort(searchParams.get("sort") ?? defaultProductSort);
  }, [searchParams]);

  // 3. sync state (or arbitrary value) to url
  const handleSearch = (overrides: Overrides = {}) => {
    const newParams = new URLSearchParams();

    // Use overrides if provided, otherwise fall back to state
    // const finalRating = overrides.rating ?? rating;
    const finalName = overrides.name ?? name;
    const finalCategories = overrides.categories ?? category;
    const finalPriceMin = overrides.priceMin ?? priceMin;
    const finalPriceMax = overrides.priceMax ?? priceMax;
    const finalRatingMin = overrides.ratingMin ?? ratingMin;
    const finalRatingMax = overrides.ratingMax ?? ratingMax;
    const finalStock = overrides.stock ?? stock;
    const finalSort = overrides.sort ?? sort;

    // finalRating.forEach((v) => newParams.append("rating", v));
    if (finalName) newParams.set("name", finalName);
    finalCategories.forEach((v) => newParams.append("category", v));
    if (finalPriceMin) newParams.set("priceMin", finalPriceMin);
    if (finalPriceMax) newParams.set("priceMax", finalPriceMax);
    if (finalRatingMin) newParams.set("ratingMin", finalRatingMin);
    if (finalRatingMax) newParams.set("ratingMax", finalRatingMax);
    finalStock.forEach((v) => newParams.append("stock", v));
    if (finalSort) {
      newParams.set("sort", finalSort);
    } else {
      setSort(defaultProductSort);
      newParams.set("sort", defaultProductSort);
    }

    // Always reset to page 1 for a new search
    newParams.set("page", "1");

    const url = `/product/all?${newParams.toString()}`;
    router.push(url);
  };

  const value = {
    name,
    setName,
    category,
    setCategory,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    ratingMin,
    setRatingMin,
    ratingMax,
    setRatingMax,
    stock,
    setStock,
    sort,
    setSort,
    handleSearch,
  };

  return (
    <ProductFilterContext.Provider value={value}>
      {children}
    </ProductFilterContext.Provider>
  );
}
