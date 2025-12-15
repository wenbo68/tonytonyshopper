// src/app/_contexts/OrderFilterProvider.tsx
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
import { defaultOrderSort } from "~/const";

type Overrides = Partial<{
  id: string;
  status: string[];
  dateMin: string;
  dateMax: string;
  priceMin: string;
  priceMax: string;
  carrier: string;
  trackingNumber: string;
  sort: string;
}>;

type OrderFilterContextType = {
  id: string;
  setId: Dispatch<SetStateAction<string>>;
  status: string[];
  setStatus: Dispatch<SetStateAction<string[]>>;
  dateMin: string;
  setDateMin: Dispatch<SetStateAction<string>>;
  dateMax: string;
  setDateMax: Dispatch<SetStateAction<string>>;
  priceMin: string;
  setPriceMin: Dispatch<SetStateAction<string>>;
  priceMax: string;
  setPriceMax: Dispatch<SetStateAction<string>>;
  carrier: string;
  setCarrier: Dispatch<SetStateAction<string>>;
  trackingNumber: string;
  setTrackingNumber: Dispatch<SetStateAction<string>>;
  sort: string;
  setSort: Dispatch<SetStateAction<string>>;
  handleSearch: (overrides?: Overrides) => void;
};

const OrderFilterContext = createContext<OrderFilterContextType | undefined>(
  undefined,
);

export function useOrderFilterContext() {
  const context = useContext(OrderFilterContext);
  if (context === undefined) {
    throw new Error(
      "useOrderFilterContext must be used within an OrderFilterProvider",
    );
  }
  return context;
}

export function OrderFilterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State initialization
  const [id, setId] = useState(() => searchParams.get("id") ?? "");
  const [status, setStatus] = useState(() => searchParams.getAll("status"));
  const [dateMin, setDateMin] = useState(
    () => searchParams.get("dateMin") ?? "",
  );
  const [dateMax, setDateMax] = useState(
    () => searchParams.get("dateMax") ?? "",
  );
  const [priceMin, setPriceMin] = useState(
    () => searchParams.get("priceMin") ?? "",
  );
  const [priceMax, setPriceMax] = useState(
    () => searchParams.get("priceMax") ?? "",
  );
  const [carrier, setCarrier] = useState(
    () => searchParams.get("carrier") ?? "",
  );
  const [trackingNumber, setTrackingNumber] = useState(
    () => searchParams.get("trackingNumber") ?? "",
  );
  const [sort, setSort] = useSessionStorageState(
    "order-sort",
    searchParams.get("sort") ?? defaultOrderSort,
  );

  // Sync URL changes to State
  // This will run once on mount (and then whenever searchParams change)
  useEffect(() => {
    setId(searchParams.get("id") ?? "");
    setStatus(searchParams.getAll("status"));
    setDateMin(searchParams.get("dateMin") ?? "");
    setDateMax(searchParams.get("dateMax") ?? "");
    setPriceMin(searchParams.get("priceMin") ?? "");
    setPriceMax(searchParams.get("priceMax") ?? "");
    setCarrier(searchParams.get("carrier") ?? "");
    setTrackingNumber(searchParams.get("trackingNumber") ?? "");
    setSort(searchParams.get("sort") ?? defaultOrderSort);
  }, [searchParams]);

  const handleSearch = (overrides: Overrides = {}) => {
    const newParams = new URLSearchParams();

    const finalId = overrides.id ?? id;
    const finalStatus = overrides.status ?? status;
    const finalDateMin = overrides.dateMin ?? dateMin;
    const finalDateMax = overrides.dateMax ?? dateMax;
    const finalPriceMin = overrides.priceMin ?? priceMin;
    const finalPriceMax = overrides.priceMax ?? priceMax;
    const finalCarrier = overrides.carrier ?? carrier;
    const finalTracking = overrides.trackingNumber ?? trackingNumber;
    const finalSort = overrides.sort ?? sort;

    if (finalId) newParams.set("id", finalId);
    finalStatus.forEach((s: string) => newParams.append("status", s));
    if (finalDateMin) newParams.set("dateMin", finalDateMin);
    if (finalDateMax) newParams.set("dateMax", finalDateMax);
    if (finalPriceMin) newParams.set("priceMin", finalPriceMin);
    if (finalPriceMax) newParams.set("priceMax", finalPriceMax);
    if (finalCarrier) newParams.set("carrier", finalCarrier);
    if (finalTracking) newParams.set("trackingNumber", finalTracking);
    if (finalSort) {
      newParams.set("sort", finalSort);
    } else {
      setSort(defaultOrderSort);
      newParams.set("sort", defaultOrderSort);
    }

    // Always reset to page 1 on filter change
    newParams.set("page", "1");

    router.push(`/orders?${newParams.toString()}`);
  };

  const value = {
    id,
    setId,
    status,
    setStatus,
    dateMin,
    setDateMin,
    dateMax,
    setDateMax,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    carrier,
    setCarrier,
    trackingNumber,
    setTrackingNumber,
    sort,
    setSort,
    handleSearch,
  };

  return (
    <OrderFilterContext.Provider value={value}>
      {children}
    </OrderFilterContext.Provider>
  );
}
