import ProductOrderingManager from "@/components/product-ordering/ProductOrderingManager";
import { getProductOrderingData } from "@/lib/admin/product-ordering/queries";

export default async function ProductOrderingPage() {
  const { products, categories, subcategories, config } =
    await getProductOrderingData();

  return (
    <main className="mx-auto max-w-7xl px-8 py-8">
      <ProductOrderingManager
        products={products}
        categories={categories}
        subcategories={subcategories}
        config={config}
      />
    </main>
  );
}
