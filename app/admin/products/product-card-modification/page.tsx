import ProductCardModificationManager from "@/components/product-card-modification/ProductCardModificationManager";
import { getProductCardStyling } from "@/lib/admin/product-card-modification/queries";

export default async function ProductCardModificationPage() {
  const config = await getProductCardStyling();

  return (
    <main className="mx-auto max-w-7xl px-8 py-8">
      <ProductCardModificationManager initialConfig={config} />
    </main>
  );
}
