export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-gray-300">Shopping Cart</h1>
      {children}
    </section>
  );
}
