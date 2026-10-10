"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ProductImage = {
  image_url: string;
  alt_text: string | null;
  display_order: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  is_active: boolean;
  display_order: number | null;
  product_images: ProductImage[] | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
};

type CollectionCard = {
  slot: number;
  collection_type: "category" | "subcategory";
  category_id: string | null;
  subcategory_id: string | null;
  heading: string;
  subheading: string;
  font_family: string;
  font_size: string;
  subheading_font_size?: string;
  font_style: "normal" | "italic";
  font_weight: "400" | "500" | "600" | "700";
  text_color: string;
  background_color: string;
};

type MerchandisingConfig = {
  collectionCards: CollectionCard[];
  newArrivals: string[];
};

type Props = {
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  config: MerchandisingConfig;
};

const MERCHANDISING_KEY = "homepage_merchandising";

function defaultCard(slot: number): CollectionCard {
  return {
    slot,
    collection_type: "category",
    category_id: null,
    subcategory_id: null,
    heading: "",
    subheading: "",
    font_family: "Georgia, serif",
    font_size: "28",
    subheading_font_size: "18",
    font_style: "normal",
    font_weight: "600",
    text_color: "#111111",
    background_color: "#F3F0E7",
  };
}

export default function ProductOrderingManager({
  products,
  categories,
  subcategories,
  config,
}: Props) {
  const supabase = createClient();

  const [ordered, setOrdered] = useState<Product[]>(() =>
    [...products].sort(
      (a: Product, b: Product) =>
        (a.display_order ?? Number.MAX_SAFE_INTEGER) -
        (b.display_order ?? Number.MAX_SAFE_INTEGER)
    )
  );

  const [search, setSearch] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState<boolean>(false);

  const [cards, setCards] = useState<CollectionCard[]>(() => {
    const saved = Array.isArray(config.collectionCards)
      ? config.collectionCards
      : [];

    return [1, 2, 3].map((slot: number) => {
      const found = saved.find(
        (card: CollectionCard) => card.slot === slot
      );
      return found ? { ...defaultCard(slot), ...found } : defaultCard(slot);
    });
  });

  const [newArrivals, setNewArrivals] = useState<string[]>(
    Array.isArray(config.newArrivals) ? [...config.newArrivals] : []
  );

  const [newSearch, setNewSearch] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [newSubcategory, setNewSubcategory] = useState<string>("");
  const [savingHomepage, setSavingHomepage] = useState<boolean>(false);

  const categoryMap = useMemo(
    () =>
      new Map<string, string>(
        categories.map(
          (category: Category): [string, string] => [
            category.id,
            category.name,
          ]
        )
      ),
    [categories]
  );

  const subcategoryMap = useMemo(
    () =>
      new Map<string, string>(
        subcategories.map(
          (subcategory: Subcategory): [string, string] => [
            subcategory.id,
            subcategory.name,
          ]
        )
      ),
    [subcategories]
  );

  const filteredProducts = useMemo<Product[]>(() => {
    const query = search.trim().toLowerCase();

    return ordered.filter((product: Product) => {
      const matchesSearch =
        query.length === 0 ||
        product.name.toLowerCase().includes(query) ||
        (product.sku ?? "").toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter.length === 0 ||
        product.category_id === categoryFilter;

      const matchesSubcategory =
        subcategoryFilter.length === 0 ||
        product.subcategory_id === subcategoryFilter;

      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [ordered, search, categoryFilter, subcategoryFilter]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMoreProducts = visibleProducts.length < filteredProducts.length;

  function handleDrop(targetId: string): void {
    if (!draggedId || draggedId === targetId) return;

    setOrdered((current: Product[]) => {
      const fromIndex = current.findIndex(
        (product: Product) => product.id === draggedId
      );
      const toIndex = current.findIndex(
        (product: Product) => product.id === targetId
      );

      if (fromIndex < 0 || toIndex < 0) return current;

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      return next;
    });

    setDraggedId(null);
  }

  async function saveGlobalOrder(): Promise<void> {
    setSavingOrder(true);

    try {
      const results = await Promise.all(
        ordered.map(
          (product: Product, index: number) =>
            supabase
              .from("products")
              .update({ display_order: index + 1 })
              .eq("id", product.id)
        )
      );

      const failed = results.find(
        (result: { error: Error | null }) => result.error
      );

      if (failed?.error) {
        throw failed.error;
      }

      setOrdered((current: Product[]) =>
        current.map((product: Product, index: number) => ({
          ...product,
          display_order: index + 1,
        }))
      );

      alert("Product order saved.");
    } catch (error) {
      alert(
        `Failed to save product order: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSavingOrder(false);
    }
  }

  function updateCard(
    slot: number,
    patch: Partial<CollectionCard>
  ): void {
    setCards((current: CollectionCard[]) =>
      current.map(
        (card: CollectionCard): CollectionCard =>
          card.slot === slot ? { ...card, ...patch } : card
      )
    );
  }

  const availableNewArrivals = useMemo<Product[]>(() => {
    const query = newSearch.trim().toLowerCase();

    return ordered.filter((product: Product) => {
      const alreadySelected = newArrivals.includes(product.id);

      const matchesSearch =
        query.length === 0 ||
        product.name.toLowerCase().includes(query) ||
        (product.sku ?? "").toLowerCase().includes(query);

      const matchesCategory =
        newCategory.length === 0 ||
        product.category_id === newCategory;

      const matchesSubcategory =
        newSubcategory.length === 0 ||
        product.subcategory_id === newSubcategory;

      return (
        !alreadySelected &&
        matchesSearch &&
        matchesCategory &&
        matchesSubcategory
      );
    });
  }, [ordered, newArrivals, newSearch, newCategory, newSubcategory]);

  function moveNewArrival(index: number, direction: -1 | 1): void {
    const targetIndex = index + direction;

    if (
      targetIndex < 0 ||
      targetIndex >= newArrivals.length
    ) {
      return;
    }

    setNewArrivals((current: string[]) => {
      const next = [...current];
      const currentId = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = currentId;
      return next;
    });
  }

  async function saveHomepage(): Promise<void> {
    setSavingHomepage(true);

    try {
      const payload = JSON.stringify({
        collectionCards: cards,
        newArrivals,
      });

      const { data: existing, error: readError } = await supabase
        .from("homepage_sections")
        .select("id")
        .eq("section_key", MERCHANDISING_KEY)
        .maybeSingle();

      if (readError) throw readError;

      if (existing) {
        const { error } = await supabase
          .from("homepage_sections")
          .update({
            section_type: "merchandising",
            description: payload,
            is_active: true,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("homepage_sections")
          .insert({
            section_key: MERCHANDISING_KEY,
            section_type: "merchandising",
            description: payload,
            display_order: 999,
            is_active: true,
          });

        if (error) throw error;
      }

      alert("Homepage configuration saved.");
    } catch (error) {
      alert(
        `Failed to save homepage configuration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSavingHomepage(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Products
          </p>
          <h1 className="text-3xl font-semibold">Product Ordering</h1>
          <p className="mt-2 text-sm text-gray-500">
            Drag products into the global order used by the storefront.
          </p>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(event.target.value);
              setVisibleCount(10);
            }}
            placeholder="Search products or SKU..."
            className="rounded-lg border px-3 py-2 text-sm"
          />

          <select
            value={categoryFilter}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              setCategoryFilter(event.target.value);
              setSubcategoryFilter("");
              setVisibleCount(10);
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((category: Category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={subcategoryFilter}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              setSubcategoryFilter(event.target.value);
              setVisibleCount(10);
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All Subcategories</option>
            {subcategories
              .filter(
                (item: Subcategory) =>
                  categoryFilter.length === 0 ||
                  item.category_id === categoryFilter
              )
              .map((item: Subcategory) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>

          <button
            type="button"
            onClick={saveGlobalOrder}
            disabled={savingOrder}
            className="rounded-lg bg-[#4A5D23] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingOrder ? "Saving..." : "Save Order"}
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border">
          {visibleProducts.map((product: Product) => {
            const image = [...(product.product_images ?? [])].sort(
              (a: ProductImage, b: ProductImage) =>
                a.display_order - b.display_order
            )[0];

            return (
              <div
                key={product.id}
                draggable
                onDragStart={() => setDraggedId(product.id)}
                onDragOver={(event: React.DragEvent<HTMLDivElement>) =>
                  event.preventDefault()
                }
                onDrop={() => handleDrop(product.id)}
                className="grid grid-cols-[40px_minmax(0,2fr)_1fr_1fr_70px_56px] items-center gap-3 border-b px-4 py-3 last:border-b-0"
              >
                <span className="text-center text-gray-400">☷</span>

                <div>
                  <div className="font-medium">
                    {ordered.findIndex(
                      (item: Product) => item.id === product.id
                    ) + 1}
                    . {product.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {product.sku || "No SKU"}
                  </div>
                </div>

                <span className="text-sm text-gray-600">
                  {categoryMap.get(product.category_id ?? "") || "—"}
                </span>

                <span className="text-sm text-gray-600">
                  {subcategoryMap.get(product.subcategory_id ?? "") || "—"}
                </span>

                <span className="text-xs font-medium text-green-700">
                  Active
                </span>

                <div className="h-10 w-10 overflow-hidden rounded-md bg-gray-100">
                  {image?.image_url ? (
                    <img
                      src={image.image_url}
                      alt={image.alt_text || product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              No products match the current filters.
            </div>
          )}
        </div>

        {filteredProducts.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Showing {visibleProducts.length} of {filteredProducts.length} matching products.
            </p>
            {hasMoreProducts && (
              <button
                type="button"
                onClick={() => setVisibleCount((current) => Math.min(current + 10, filteredProducts.length))}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View more
              </button>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Homepage
          </p>
          <h2 className="text-2xl font-semibold">
            Homepage Collection Cards
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure exactly three collection cards.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {[...cards]
            .sort(
              (a: CollectionCard, b: CollectionCard) =>
                a.slot - b.slot
            )
            .map((card: CollectionCard) => (
              <div
                key={card.slot}
                className="rounded-xl border p-4"
              >
                <h3 className="mb-4 font-semibold">
                  Card {card.slot}
                </h3>

                <div className="space-y-3">
                  <select
                    value={card.collection_type}
                    onChange={(
                      event: React.ChangeEvent<HTMLSelectElement>
                    ) =>
                      updateCard(card.slot, {
                        collection_type:
                          event.target.value as CollectionCard["collection_type"],
                        subcategory_id: null,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="category">Category</option>
                    <option value="subcategory">
                      Subcategory
                    </option>
                  </select>

                  <select
                    value={card.category_id ?? ""}
                    onChange={(
                      event: React.ChangeEvent<HTMLSelectElement>
                    ) =>
                      updateCard(card.slot, {
                        category_id:
                          event.target.value || null,
                        subcategory_id: null,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category: Category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {card.collection_type === "subcategory" && (
                    <select
                      value={card.subcategory_id ?? ""}
                      onChange={(
                        event: React.ChangeEvent<HTMLSelectElement>
                      ) =>
                        updateCard(card.slot, {
                          subcategory_id:
                            event.target.value || null,
                        })
                      }
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    >
                      <option value="">
                        Select Subcategory
                      </option>
                      {subcategories
                        .filter(
                          (item: Subcategory) =>
                            !card.category_id ||
                            item.category_id === card.category_id
                        )
                        .map((item: Subcategory) => (
                          <option
                            key={item.id}
                            value={item.id}
                          >
                            {item.name}
                          </option>
                        ))}
                    </select>
                  )}

                  <input
                    value={card.heading}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) =>
                      updateCard(card.slot, {
                        heading: event.target.value,
                      })
                    }
                    placeholder="Heading"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />

                  <input
                    value={card.subheading}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) =>
                      updateCard(card.slot, {
                        subheading: event.target.value,
                      })
                    }
                    placeholder="Subheading"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-gray-500">
                      Font Family
                      <select
                        value={card.font_family}
                        onChange={(
                          event: React.ChangeEvent<HTMLSelectElement>
                        ) =>
                          updateCard(card.slot, {
                            font_family: event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
                      >
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Times New Roman, serif">Times New Roman</option>
                        <option value="Palatino Linotype, Book Antiqua, Palatino, serif">Palatino</option>
                        <option value="Garamond, serif">Garamond</option>
                        <option value="Baskerville, serif">Baskerville</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="Trebuchet MS, sans-serif">Trebuchet MS</option>
                        <option value="Tahoma, sans-serif">Tahoma</option>
                        <option value="Arial Narrow, Arial, sans-serif">Arial Narrow</option>
                        <option value="Impact, fantasy">Impact</option>
                        <option value="Courier New, monospace">Courier New</option>
                        <option value="Lucida Console, monospace">Lucida Console</option>
                        <option value="system-ui, sans-serif">System UI</option>
                      </select>
                    </label>

                    <label className="text-xs text-gray-500">
                      Heading Size
                      <input
                        type="number"
                        min="16"
                        max="72"
                        value={
                          /^\d+(\.\d+)?$/.test(card.font_size)
                            ? card.font_size
                            : card.font_size === "small"
                              ? "20"
                              : card.font_size === "medium"
                                ? "24"
                                : card.font_size === "xlarge"
                                  ? "36"
                                  : "28"
                        }
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          updateCard(card.slot, {
                            font_size: event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
                      />
                    </label>

                    <label className="text-xs text-gray-500">
                      Subheading Size
                      <input
                        type="number"
                        min="10"
                        max="40"
                        value={card.subheading_font_size || "18"}
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          updateCard(card.slot, {
                            subheading_font_size: event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
                      />
                    </label>

                    <select
                      value={card.font_style}
                      onChange={(
                        event: React.ChangeEvent<HTMLSelectElement>
                      ) =>
                        updateCard(card.slot, {
                          font_style:
                            event.target.value as CollectionCard["font_style"],
                        })
                      }
                      className="rounded-lg border px-2 py-2 text-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>

                    <select
                      value={card.font_weight}
                      onChange={(
                        event: React.ChangeEvent<HTMLSelectElement>
                      ) =>
                        updateCard(card.slot, {
                          font_weight:
                            event.target.value as CollectionCard["font_weight"],
                        })
                      }
                      className="rounded-lg border px-2 py-2 text-sm"
                    >
                      <option value="400">Regular</option>
                      <option value="500">Medium</option>
                      <option value="600">Semibold</option>
                      <option value="700">Bold</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs text-gray-500">
                      Text
                      <input
                        type="color"
                        value={card.text_color}
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          updateCard(card.slot, {
                            text_color: event.target.value,
                          })
                        }
                        className="mt-1 h-9 w-full rounded border"
                      />
                    </label>

                    <label className="text-xs text-gray-500">
                      Background
                      <input
                        type="color"
                        value={card.background_color}
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          updateCard(card.slot, {
                            background_color:
                              event.target.value,
                          })
                        }
                        className="mt-1 h-9 w-full rounded border"
                      />
                    </label>
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: card.background_color,
                      color: card.text_color,
                      fontFamily:
                        card.font_family === "serif"
                          ? "Georgia, serif"
                          : card.font_family === "sans"
                            ? "ui-sans-serif, sans-serif"
                            : card.font_family === "mono"
                              ? "ui-monospace, monospace"
                              : card.font_family,
                      fontSize:
                        /^\d+(\.\d+)?$/.test(card.font_size)
                          ? Number(card.font_size)
                          : card.font_size === "small"
                            ? 20
                            : card.font_size === "medium"
                              ? 24
                              : card.font_size === "xlarge"
                                ? 36
                                : 28,
                      fontStyle: card.font_style,
                      fontWeight: Number(card.font_weight),
                    }}
                  >
                    <div>
                      {card.heading || "Heading preview"}
                    </div>
                    <div
                      className="mt-1 opacity-70"
                      style={{
                        fontSize: `${card.subheading_font_size || "18"}px`,
                      }}
                    >
                      {card.subheading ||
                        "Subheading preview"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Homepage
          </p>
          <h2 className="text-2xl font-semibold">
            New Arrivals
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Select products and control their homepage order.
          </p>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <input
            value={newSearch}
            onChange={(
              event: React.ChangeEvent<HTMLInputElement>
            ) => setNewSearch(event.target.value)}
            placeholder="Search products..."
            className="rounded-lg border px-3 py-2 text-sm"
          />

          <select
            value={newCategory}
            onChange={(
              event: React.ChangeEvent<HTMLSelectElement>
            ) => {
              setNewCategory(event.target.value);
              setNewSubcategory("");
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((category: Category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={newSubcategory}
            onChange={(
              event: React.ChangeEvent<HTMLSelectElement>
            ) => setNewSubcategory(event.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All Subcategories</option>
            {subcategories
              .filter(
                (item: Subcategory) =>
                  !newCategory ||
                  item.category_id === newCategory
              )
              .map((item: Subcategory) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold">
              Available Products
            </h3>

            {availableNewArrivals.map(
              (product: Product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {categoryMap.get(
                        product.category_id ?? ""
                      ) || ""}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNewArrivals((current: string[]) => [
                        ...current,
                        product.id,
                      ])
                    }
                    className="rounded-md border px-3 py-1.5 text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              )
            )}

            {availableNewArrivals.length === 0 && (
              <p className="py-6 text-sm text-gray-500">
                No products match the current filters.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">
              Selected Order ({newArrivals.length})
            </h3>

            {newArrivals.map(
              (id: string, index: number) => {
                const product = ordered.find(
                  (item: Product) => item.id === id
                );

                if (!product) return null;

                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 rounded-lg border px-3 py-3"
                  >
                    <span className="w-6 text-center text-xs text-gray-400">
                      {index + 1}
                    </span>

                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {product.name}
                    </span>

                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() =>
                        moveNewArrival(index, -1)
                      }
                      className="rounded border px-2 py-1 text-xs"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      disabled={
                        index === newArrivals.length - 1
                      }
                      onClick={() =>
                        moveNewArrival(index, 1)
                      }
                      className="rounded border px-2 py-1 text-xs"
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setNewArrivals((current: string[]) =>
                          current.filter(
                            (item: string) => item !== id
                          )
                        )
                      }
                      className="rounded border px-2 py-1 text-xs text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                );
              }
            )}

            {newArrivals.length === 0 && (
              <p className="rounded-lg border border-dashed p-6 text-sm text-gray-500">
                No New Arrivals selected.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={savingHomepage}
            onClick={saveHomepage}
            className="rounded-lg bg-[#4A5D23] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingHomepage
              ? "Saving..."
              : "Save Homepage Configuration"}
          </button>
        </div>
      </section>
    </div>
  );
}
