import BackButton from "../_components/BackButton";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 text-center">
      <BackButton />
      {children}
    </section>
  );
}
