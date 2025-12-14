// import ProductFilters from "~/app/_components/product/ProductFilters";
// import ProductLabels from "~/app/_components/product/ProductLabels";
// import { api } from "~/trpc/server";
import OrderFilters from "../../_components/order/OrderFilters";
import OrderLabels from "../../_components/order/OrderLabels";
// import { OrderFilterProvider } from "../_contexts/OrderFilterProvider";

export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // // 1. Fetch categories server-side
  // const categories = await api.product.getCategories();

  // // 2. Format for the Filter component
  // const categoryOptions = categories.map((cat) => ({
  //   label: cat.name,
  //   urlInput: cat.id,
  // }));

  return (
    <section className="flex flex-col justify-center gap-8 sm:gap-9 md:gap-10 lg:gap-11 xl:gap-12">
      {/* <h1 className="text-left text-2xl font-bold text-gray-300">
        Order History
      </h1> */}
      <OrderFilters />
      <OrderLabels />
      {children}
    </section>
  );
}
