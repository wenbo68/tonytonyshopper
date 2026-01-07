import ProductFilters from "~/app/_components/filter/filters/ProductFilters";
import ProductFilterPills from "~/app/_components/filter/filterPills/ProductFilterPills";
import { api } from "~/trpc/server";
import { ProductFilterProvider } from "~/app/_contexts/filter/ProductFilterProvider";
import { Suspense } from "react";

export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // 1. Fetch categories server-side
  const categories = await api.product.getCategories();

  // 2. Format for the Filter component
  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    urlInput: cat.id,
  }));

  return (
    <Suspense>
      <ProductFilterProvider>
        <section className="flex flex-col justify-center gap-8 sm:gap-9 md:gap-10 lg:gap-11 xl:gap-12">
          <ProductFilters categoryOptions={categoryOptions} />
          <ProductFilterPills categoryOptions={categoryOptions} />
          <Suspense
            fallback={
              <div className="animate-pulse text-center">
                Loading products...
              </div>
            }
          >
            {children}
          </Suspense>
        </section>
      </ProductFilterProvider>
    </Suspense>
  );
}
