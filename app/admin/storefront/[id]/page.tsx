import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StorefrontNavCardEditForm from "@/components/storefront/StorefrontNavCardEditForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditStorefrontCardPage({
  params,
}: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: card, error } = await supabase
    .from("storefront_nav_cards")
    .select(`
      id,
      card_type,
      title,
      image_url,
      href,
      is_active,
      display_order
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!card) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <Link
          href="/admin/storefront"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to Storefront
        </Link>

        <h1 className="mt-4 text-2xl font-semibold">
          Edit Storefront Card
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage the card shown on the storefront.
        </p>
      </div>

      <StorefrontNavCardEditForm card={card} />
    </main>
  );
}
