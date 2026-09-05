"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Card = {
  id: string;
  card_type: "category" | "subcategory" | "product" | "custom";
  title: string;
  image_url: string | null;
  href: string | null;
  is_active: boolean;
  display_order: number;
};

type Props = {
  cards: Card[];
};

export default function StorefrontNavCardReorder({ cards }: Props) {
  const [orderedCards, setOrderedCards] = useState(() =>
    [...cards].sort((a, b) => {
      if (a.display_order !== b.display_order) {
        return a.display_order - b.display_order;
      }

      return a.title.localeCompare(b.title);
    })
  );

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleDragStart(id: string) {
    setDraggedId(id);
    setMessage("");
    setError("");
  }

  function handleDragOver(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
    targetId: string
  ) {
    event.preventDefault();

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    setOrderedCards((current) => {
      const fromIndex = current.findIndex(
        (card) => card.id === draggedId
      );

      const toIndex = current.findIndex(
        (card) => card.id === targetId
      );

      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }

      const next = [...current];
      const [movedCard] = next.splice(fromIndex, 1);

      next.splice(toIndex, 0, movedCard);

      return next;
    });

    setDraggedId(null);
    setMessage("");
    setError("");
  }

  function moveCard(
    index: number,
    direction: "up" | "down"
  ) {
    const targetIndex =
      direction === "up" ? index - 1 : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= orderedCards.length
    ) {
      return;
    }

    setOrderedCards((current) => {
      const next = [...current];

      const [movedCard] = next.splice(index, 1);

      next.splice(targetIndex, 0, movedCard);

      return next;
    });

    setMessage("");
    setError("");
  }

  async function saveOrder() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const supabase = createClient();

      const updates = orderedCards.map((card, index) =>
        supabase
          .from("storefront_nav_cards")
          .update({
            display_order: index,
            updated_at: new Date().toISOString(),
          })
          .eq("id", card.id)
      );

      const results = await Promise.all(updates);

      const failed = results.find(
        (result) => result.error
      );

      if (failed?.error) {
        throw new Error(failed.error.message);
      }

      setOrderedCards((current) =>
        current.map((card, index) => ({
          ...card,
          display_order: index,
        }))
      );

      setMessage(
        "Rail order saved successfully. Refresh the storefront to see the new order."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save rail order."
      );
    } finally {
      setSaving(false);
    }
  }

  if (orderedCards.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-gray-500">
        No storefront cards have been configured yet.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div>
          <h2 className="font-semibold">
            Circular Navigation Cards
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Drag cards to change the order shown in the
            storefront rail.
          </p>
        </div>

        <button
          type="button"
          onClick={saveOrder}
          disabled={saving}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Order"}
        </button>
      </div>

      {message && (
        <div className="mx-6 mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {orderedCards.map((card, index) => (
          <div
            key={card.id}
            draggable
            onDragStart={() => handleDragStart(card.id)}
            onDragOver={handleDragOver}
            onDrop={(event) =>
              handleDrop(event, card.id)
            }
            onDragEnd={() => setDraggedId(null)}
            className={`flex items-center gap-4 px-6 py-4 transition ${
              draggedId === card.id
                ? "opacity-40"
                : "opacity-100"
            }`}
          >
            <div
              className="cursor-grab select-none px-1 text-xl text-gray-400 active:cursor-grabbing"
              title="Drag to reorder"
            >
              ⋮⋮
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50">
              {card.image_url ? (
                <img
                  src={card.image_url}
                  alt={card.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl text-gray-400">
                  ✿
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {card.title}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="rounded-full bg-gray-100 px-2 py-1 uppercase">
                  {card.card_type}
                </span>

                <span>
                  Position {index + 1}
                </span>

                <span
                  className={
                    card.is_active
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                >
                  {card.is_active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              {card.href && (
                <div className="mt-1 truncate text-xs text-gray-400">
                  {card.href}
                </div>
              )}
            </div>

            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => moveCard(index, "up")}
                disabled={index === 0 || saving}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={`Move ${card.title} up`}
              >
                ↑
              </button>

              <button
                type="button"
                onClick={() => moveCard(index, "down")}
                disabled={
                  index === orderedCards.length - 1 ||
                  saving
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={`Move ${card.title} down`}
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
