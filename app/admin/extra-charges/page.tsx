import ExtraChargesManager from "@/components/extra-charges/ExtraChargesManager";

export default function ExtraChargesPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Extra Charges &amp; Promotions
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage delivery pricing, category-specific charges, and fixed-value promo codes.
        </p>
        <ExtraChargesManager />
      </div>
    </main>
  );
}