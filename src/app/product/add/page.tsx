import AddProductForm from "~/app/_components/AddProductForm";
import { api } from "~/trpc/server";

export default async function AddProductPage() {
  // 1. Fetch categories server-side
  const categories = await api.product.getCategories();

  return (
    <section className="mx-auto max-w-2xl">
      <AddProductForm categories={categories} />
    </section>
  );
}
