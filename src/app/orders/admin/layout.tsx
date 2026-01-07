import AdminOrderFilters from "~/app/_components/filter/filters/AdminOrderFilters";
import AdminOrderFilterPills from "~/app/_components/filter/filterPills/AdminOrderFilterPills";
import { AdminOrderFilterProvider } from "~/app/_contexts/filter/AdminOrderFilterProvider";
import { Suspense } from "react";

export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense>
      <AdminOrderFilterProvider>
        <section className="flex flex-col justify-center gap-8 sm:gap-9 md:gap-10 lg:gap-11 xl:gap-12">
          <AdminOrderFilters />
          <AdminOrderFilterPills />
          <Suspense
            fallback={
              <div className="animate-pulse text-center">
                Loading sales history...
              </div>
            }
          >
            {children}
          </Suspense>
        </section>
      </AdminOrderFilterProvider>
    </Suspense>
  );
}
