import Link from "next/link";
import StorefrontNavCardActions from "@/components/storefront/StorefrontNavCardActions";
import StorefrontNavCardReorder from "@/components/storefront/StorefrontNavCardReorder";
import { getAdminStorefrontNavCards } from "@/lib/admin/storefront/queries";

export default async function StorefrontPage() {
  const cards = await getAdminStorefrontNavCards();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Storefront
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage the circular navigation cards shown on
            the storefront.
          </p>
        </div>

        <Link
          href="/admin/storefront/new"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Add Card
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <StorefrontNavCardReorder cards={cards} />
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold">
            Card Management
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Edit card content, images, target URLs, and
            activation status.
          </p>
        </div>

        {cards.length === 0 ? (
          <div className="px-6 py-8 text-sm text-gray-500">
            No cards available.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center gap-4 px-6 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {card.title}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    Position {card.display_order + 1}
                    {" · "}
                    {card.card_type}
                    {" · "}
                    {card.is_active
                      ? "Active"
                      : "Inactive"}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/admin/storefront/${card.id}`}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Edit
                  </Link>

                  <StorefrontNavCardActions
                    id={card.id}
                    isActive={card.is_active}
                    imageUrl={card.image_url}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
