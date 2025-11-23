"use client";

import SeedButton from "../../_components/SeedButton";
import Products from "~/app/_components/product/Products";

export default function ProductPage() {
  return (
    <div className="flex flex-col gap-5">
      <SeedButton />
      <Products />
    </div>
  );
}
