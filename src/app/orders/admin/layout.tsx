import AdminOrderFilters from "~/app/_components/order/admin/AdminOrderFilters";
import AdminOrderLabels from "~/app/_components/order/admin/AdminOrderLabels";

export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="flex flex-col justify-center gap-8 sm:gap-9 md:gap-10 lg:gap-11 xl:gap-12">
      <AdminOrderFilters />
      <AdminOrderLabels />
      {children}
    </section>
  );
}
