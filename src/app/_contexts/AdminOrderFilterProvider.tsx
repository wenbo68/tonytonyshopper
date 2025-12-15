// src/app/_contexts/SellHistoryFilterProvider.tsx
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
import { defaultOrderSort } from "~/const";

type AdminOrderFilterContextType = {
  id: string;
  setId: Dispatch<SetStateAction<string>>;
  customerName: string;
  setCustomerName: Dispatch<SetStateAction<string>>;
  customerEmail: string;
  setCustomerEmail: Dispatch<SetStateAction<string>>;
  dateMin: string;
  setDateMin: Dispatch<SetStateAction<string>>;
  dateMax: string;
  setDateMax: Dispatch<SetStateAction<string>>;
  priceMin: string;
  setPriceMin: Dispatch<SetStateAction<string>>;
  priceMax: string;
  setPriceMax: Dispatch<SetStateAction<string>>;
  status: string[];
  setStatus: Dispatch<SetStateAction<string[]>>;
  carrier: string;
  setCarrier: Dispatch<SetStateAction<string>>;
  trackingNumber: string;
  setTrackingNumber: Dispatch<SetStateAction<string>>;
  sort: string;
  setSort: Dispatch<SetStateAction<string>>;
  handleSearch: (
    overrides?: Partial<{
      id: string;
      customerName: string;
      customerEmail: string;
      dateMin: string;
      dateMax: string;
      priceMin: string;
      priceMax: string;
      status: string[];
      carrier: string;
      trackingNumber: string;
      sort: string;
    }>,
  ) => void;
};

const AdminOrderFilterContext = createContext<
  AdminOrderFilterContextType | undefined
>(undefined);

export function useAdminOrderFilterContext() {
  const context = useContext(AdminOrderFilterContext);
  if (!context)
    throw new Error("useSellHistoryFilterContext must be used within provider");
  return context;
}

export function AdminOrderFilterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [id, setId] = useState(searchParams.get("id") ?? "");
  const [dateMin, setDateMin] = useState(searchParams.get("dateMin") ?? "");
  const [dateMax, setDateMax] = useState(searchParams.get("dateMax") ?? "");
  const [customerName, setCustomerName] = useState(
    searchParams.get("customerName") ?? "",
  );
  const [customerEmail, setCustomerEmail] = useState(
    searchParams.get("customerEmail") ?? "",
  );
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");
  const [status, setStatus] = useState(searchParams.getAll("status"));
  const [carrier, setCarrier] = useState(searchParams.get("carrier") ?? "");
  const [trackingNumber, setTrackingNumber] = useState(
    searchParams.get("trackingNumber") ?? "",
  );
  const [sort, setSort] = useSessionStorageState(
    "order-sort",
    searchParams.get("sort") ?? defaultOrderSort,
  );

  // Sync URL -> State
  useEffect(() => {
    setId(searchParams.get("id") ?? "");
    setDateMin(searchParams.get("dateMin") ?? "");
    setDateMax(searchParams.get("dateMax") ?? "");
    setCustomerName(searchParams.get("customerName") ?? "");
    setCustomerEmail(searchParams.get("customerEmail") ?? "");
    setPriceMin(searchParams.get("priceMin") ?? "");
    setPriceMax(searchParams.get("priceMax") ?? "");
    setStatus(searchParams.getAll("status"));
    setCarrier(searchParams.get("carrier") ?? "");
    setTrackingNumber(searchParams.get("trackingNumber") ?? "");
    setSort(searchParams.get("sort") ?? defaultOrderSort);
  }, [searchParams]);

  // Sync State -> URL
  const handleSearch = (overrides: any = {}) => {
    const newParams = new URLSearchParams();
    const v = (key: string, val: any, defaultVal: any) =>
      overrides[key] ?? val ?? defaultVal;

    const fId = v("id", id, "");
    const fDateMin = v("dateMin", dateMin, "");
    const fDateMax = v("dateMax", dateMax, "");
    const fName = v("customerName", customerName, "");
    const fEmail = v("customerEmail", customerEmail, "");
    const fPriceMin = v("priceMin", priceMin, "");
    const fPriceMax = v("priceMax", priceMax, "");
    const fStatus = overrides.status ?? status;
    const fCarrier = v("carrier", carrier, "");
    const fTracking = v("trackingNumber", trackingNumber, "");
    const fSort = v("sort", sort, "date-desc");

    if (fId) newParams.set("id", fId);
    if (fDateMin) newParams.set("dateMin", fDateMin);
    if (fDateMax) newParams.set("dateMax", fDateMax);
    if (fName) newParams.set("customerName", fName);
    if (fEmail) newParams.set("customerEmail", fEmail);
    if (fPriceMin) newParams.set("priceMin", fPriceMin);
    if (fPriceMax) newParams.set("priceMax", fPriceMax);
    fStatus.forEach((s: string) => newParams.append("status", s));
    if (fCarrier) newParams.set("carrier", fCarrier);
    if (fTracking) newParams.set("trackingNumber", fTracking);
    if (fSort) {
      newParams.set("sort", fSort);
    } else {
      setSort(defaultOrderSort);
      newParams.set("sort", defaultOrderSort);
    }

    newParams.set("page", "1"); // Reset page
    router.push(`/orders/admin?${newParams.toString()}`);
  };

  return (
    <AdminOrderFilterContext.Provider
      value={{
        id,
        setId,
        dateMin,
        setDateMin,
        dateMax,
        setDateMax,
        customerName,
        setCustomerName,
        customerEmail,
        setCustomerEmail,
        priceMin,
        setPriceMin,
        priceMax,
        setPriceMax,
        status,
        setStatus,
        carrier,
        setCarrier,
        trackingNumber,
        setTrackingNumber,
        sort,
        setSort,
        handleSearch,
      }}
    >
      {children}
    </AdminOrderFilterContext.Provider>
  );
}
