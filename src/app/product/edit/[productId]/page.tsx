import { notFound } from "next/navigation";
import AddProductForm from "~/app/_components/AddProductForm";
import { api } from "~/trpc/server";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  // // 1. Fetch data server-side
  // const [product, categories] = await Promise.all([
  //   api.product.getById({ id: productId }),
  //   api.product.getCategories(),
  // ]);

  // // 2. Handle invalid product ID
  // if (!product) {
  //   return notFound();
  // }

  const categories = await api.product.getCategories();

  // 3. Render the shared form with initial data
  return (
    <section className="mx-auto max-w-2xl">
      <AddProductForm
        categories={categories}
        // initialData={product}
        productId={productId}
      />
    </section>
  );
}
