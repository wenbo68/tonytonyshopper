import AdminOrderFilters from "~/app/_components/filter/filters/AdminOrderFilters";
import AdminOrderFilterPills from "~/app/_components/filter/filterPills/AdminOrderFilterPills";

export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="flex flex-col justify-center gap-8 sm:gap-9 md:gap-10 lg:gap-11 xl:gap-12">
      <AdminOrderFilters />
      <AdminOrderFilterPills />
      {children}
    </section>
  );
}
