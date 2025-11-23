// src/app/_components/order/OrderLabels.tsx
"use client";

import { useMemo } from "react";
import { useOrderFilterContext } from "~/app/_contexts/OrderFilterProvider";
import { ClickableLabel, LabelContainer } from "../filter/Label";

export default function OrderLabels() {
  const {
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
    handleSearch,
  } = useOrderFilterContext();

  const activeLabels = useMemo(() => {
    const labels = [];

    if (id) {
      labels.push({
        key: "id",
        label: `Order: ${id}`,
        onRemove: () => {
          setId("");
          handleSearch({ id: "" });
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
    status,
    dateMin,
    dateMax,
    priceMin,
    priceMax,
    carrier,
    trackingNumber,
    setId,
    setStatus,
    setDateMin,
    setDateMax,
    setPriceMin,
    setPriceMax,
    setCarrier,
    setTrackingNumber,
    handleSearch,
  ]);

  if (activeLabels.length === 0) return null;

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
    </LabelContainer>
  );
}
