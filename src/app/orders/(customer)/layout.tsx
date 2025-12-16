import OrderFilters from "../../_components/filter/filters/OrderFilters";
import OrderFilterPills from "../../_components/filter/filterPills/OrderFilterPills";
import { OrderFilterProvider } from "~/app/_contexts/filter/OrderFilterProvider";

export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <OrderFilterProvider>
      <section className="flex flex-col justify-center gap-8 sm:gap-9 md:gap-10 lg:gap-11 xl:gap-12">
        <OrderFilters />
        <OrderFilterPills />
        {children}
      </section>
    </OrderFilterProvider>
  );
}
