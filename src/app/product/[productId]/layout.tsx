// import ReviewSection from "~/app/_components/review/ReviewSection";
import { ProductProvider } from "~/app/_contexts/ProductProvider";

export default async function Layout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ productId: string }>;
}>) {
  const { productId } = await params;

  return (
    <ProductProvider productId={productId}>
      <section className="mx-auto flex max-w-2xl flex-col gap-7 sm:gap-7">
        {children}
      </section>
    </ProductProvider>
  );
}
