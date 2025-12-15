"use client";

import { useMemo } from "react";
import { useAdminOrderFilterContext } from "~/app/_contexts/AdminOrderFilterProvider";
import {
  ClickablePill,
  PillContainer,
  UnclickablePill,
} from "../../filter/FilterPill";
import type { PillConfig } from "~/type";
import { adminOrderSortOptions } from "~/const";

export default function AdminOrderFilterPills() {
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
  } = useAdminOrderFilterContext();

  const { pillConfigs, sortLabel } = useMemo(() => {
    const configs: PillConfig[] = [];

    if (id) {
      configs.push({
        key: "id",
        label: `ID: ${id}`,
        onRemove: () => {
          setId("");
          handleSearch({ id: "" });
        },
        color: 1,
      });
    }

    if (dateMin) {
      configs.push({
        key: "date-min",
        label: `Start: ${dateMin}`,
        onRemove: () => {
          setDateMin("");
          handleSearch({ dateMin: "" });
        },
        color: 2,
      });
    }
    if (dateMax) {
      configs.push({
        key: "date-max",
        label: `End: ${dateMax}`,
        onRemove: () => {
          setDateMax("");
          handleSearch({ dateMax: "" });
        },
        color: 2,
      });
    }

    if (customerName) {
      configs.push({
        key: "name",
        label: `Name: ${customerName}`,
        onRemove: () => {
          setCustomerName("");
          handleSearch({ customerName: "" });
        },
        color: 3,
      });
    }
    if (customerEmail) {
      configs.push({
        key: "email",
        label: `Email: ${customerEmail}`,
        onRemove: () => {
          setCustomerEmail("");
          handleSearch({ customerEmail: "" });
        },
        color: 3,
      });
    }

    if (priceMin) {
      configs.push({
        key: "price-min",
        label: `Total Min: $${priceMin}`,
        onRemove: () => {
          setPriceMin("");
          handleSearch({ priceMin: "" });
        },
        color: 4,
      });
    }
    if (priceMax) {
      configs.push({
        key: "price-max",
        label: `Total Max: $${priceMax}`,
        onRemove: () => {
          setPriceMax("");
          handleSearch({ priceMax: "" });
        },
        color: 4,
      });
    }

    status.forEach((s) => {
      configs.push({
        key: `status-${s}`,
        label: `Status: ${s.charAt(0).toUpperCase() + s.slice(1)}`,
        onRemove: () => {
          const newStatus = status.filter((item) => item !== s);
          setStatus(newStatus);
          handleSearch({ status: newStatus });
        },
        color: 5,
      });
    });

    if (carrier) {
      configs.push({
        key: "carrier",
        label: `Carrier: ${carrier}`,
        onRemove: () => {
          setCarrier("");
          handleSearch({ carrier: "" });
        },
        color: 6,
      });
    }
    if (trackingNumber) {
      configs.push({
        key: "tracking",
        label: `Tracking: ${trackingNumber}`,
        onRemove: () => {
          setTrackingNumber("");
          handleSearch({ trackingNumber: "" });
        },
        color: 6,
      });
    }

    // Sort Label
    let sortLabel: string | null = null;
    if (sort) {
      for (const group of adminOrderSortOptions) {
        const foundOption = group.options.find((opt) => opt.urlInput === sort);
        if (foundOption) {
          sortLabel = `${group.groupLabel}: ${foundOption.label}`;
          break;
        }
      }
    }

    return { pillConfigs: configs, sortLabel };
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

  return (
    <PillContainer>
      <>
        {pillConfigs.map((config) => {
          return config.onRemove ? (
            <ClickablePill
              key={config.key}
              label={config.label}
              color={config.color}
              onRemove={config.onRemove}
            />
          ) : (
            <UnclickablePill
              key={config.key}
              label={config.label}
              color={config.color}
            />
          );
        })}
        <UnclickablePill label={sortLabel ?? "Empty Search"} color="gray" />
      </>
    </PillContainer>
  );
}
