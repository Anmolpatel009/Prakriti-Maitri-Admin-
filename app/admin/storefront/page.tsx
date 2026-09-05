import Link from "next/link";
import StorefrontNavCardActions from "@/components/storefront/StorefrontNavCardActions";
import { getAdminStorefrontNavCards } from "@/lib/admin/storefront/queries";

export default async function StorefrontPage() {
  const cards = await getAdminStorefrontNavCards();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Storefront</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the circular navigation cards shown on the storefront.
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
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold">Circular Navigation Cards</h2>
        </div>

        {cards.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No storefront cards have been configured yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center gap-4 px-6 py-4"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={card.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl text-gray-400">
                      ✿
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-medium">{card.title}</div>

                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2 py-1 uppercase">
                      {card.card_type}
                    </span>

                    <span>Order: {card.display_order}</span>

                    <span
                      className={
                        card.is_active
                          ? "text-green-600"
                          : "text-gray-400"
                      }
                    >
                      {card.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {card.href && (
                    <div className="mt-1 truncate text-xs text-gray-400">
                      {card.href}
                    </div>
                  )}
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
