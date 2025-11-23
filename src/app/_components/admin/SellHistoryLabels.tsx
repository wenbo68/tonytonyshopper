// src/app/_components/admin/SellHistoryLabels.tsx
"use client";

import { useMemo } from "react";
import { useSellHistoryFilterContext } from "~/app/_contexts/SellHistoryFilterProvider";
import {
  ClickableLabel,
  LabelContainer,
  UnclickableLabel,
} from "../filter/Label";

export default function SellHistoryLabels() {
  const {
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
    handleSearch,
  } = useSellHistoryFilterContext();

  const activeLabels = useMemo(() => {
    const labels = [];

    if (id) {
      labels.push({
        key: "id",
        label: `ID: ${id}`,
        onRemove: () => {
          setId("");
          handleSearch({ id: "" });
        },
        type: "name" as const,
      });
    }
    if (customerName) {
      labels.push({
        key: "name",
        label: `Customer: ${customerName}`,
        onRemove: () => {
          setCustomerName("");
          handleSearch({ customerName: "" });
        },
        type: "name" as const,
      });
    }
    if (customerEmail) {
      labels.push({
        key: "email",
        label: `Email: ${customerEmail}`,
        onRemove: () => {
          setCustomerEmail("");
          handleSearch({ customerEmail: "" });
        },
        type: "name" as const,
      });
    }

    status.forEach((s) => {
      labels.push({
        key: `status-${s}`,
        label: s.toUpperCase(),
        onRemove: () => {
          const newStatus = status.filter((item) => item !== s);
          setStatus(newStatus);
          handleSearch({ status: newStatus });
        },
        type: "category" as const,
      });
    });

    if (dateMin || dateMax) {
      labels.push({
        key: "date",
        label: `Date: ${dateMin || "Start"} - ${dateMax || "End"}`,
        onRemove: () => {
          setDateMin("");
          setDateMax("");
          handleSearch({ dateMin: "", dateMax: "" });
        },
        type: "stock" as const,
      });
    }

    if (priceMin || priceMax) {
      labels.push({
        key: "price",
        label: `Price: $${priceMin || "0"} - $${priceMax || "Inf"}`,
        onRemove: () => {
          setPriceMin("");
          setPriceMax("");
          handleSearch({ priceMin: "", priceMax: "" });
        },
        type: "price" as const,
      });
    }

    if (carrier) {
      labels.push({
        key: "carrier",
        label: `Carrier: ${carrier}`,
        onRemove: () => {
          setCarrier("");
          handleSearch({ carrier: "" });
        },
        type: "rating" as const,
      });
    }
    if (trackingNumber) {
      labels.push({
        key: "tracking",
        label: `Tracking: ${trackingNumber}`,
        onRemove: () => {
          setTrackingNumber("");
          handleSearch({ trackingNumber: "" });
        },
        type: "rating" as const,
      });
    }

    return labels;
  }, [
    id,
    dateMin,
    dateMax,
    customerName,
    customerEmail,
    priceMin,
    priceMax,
    status,
    carrier,
    trackingNumber,
    setId,
    setDateMin,
    setDateMax,
    setCustomerName,
    setCustomerEmail,
    setPriceMin,
    setPriceMax,
    setStatus,
    setCarrier,
    setTrackingNumber,
    handleSearch,
  ]);

  // Helper to display friendly sort label
  const getSortLabel = (s: string) => {
    switch (s) {
      case "date-desc":
        return "Newest First";
      case "date-asc":
        return "Oldest First";
      case "price-desc":
        return "Price: High to Low";
      case "price-asc":
        return "Price: Low to High";
      case "name-asc":
        return "Name: A-Z";
      case "name-desc":
        return "Name: Z-A";
      case "email-asc":
        return "Email: A-Z";
      case "email-desc":
        return "Email: Z-A";
      default:
        return s;
    }
  };

  return (
    <LabelContainer>
      {activeLabels.map((l) => (
        <ClickableLabel
          key={l.key}
          label={l.label}
          colorType={l.type}
          onRemove={l.onRemove}
        />
      ))}
      {sort && (
        <UnclickableLabel
          label={`Sort: ${getSortLabel(sort)}`}
          colorType="order"
        />
      )}
    </LabelContainer>
  );
}
