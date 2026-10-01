"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  NavbarCustomizationConfig,
  NavbarItem,
} from "@/lib/admin/navbar-modification/queries";

type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
};

type Props = {
  initialConfig: NavbarCustomizationConfig;
  categories: Category[];
  subcategories: Subcategory[];
};

const NAVBAR_CUSTOMIZATION_KEY = "navbar_customization";

function itemLabel(
  item: NavbarItem,
  categories: Category[],
  subcategories: Subcategory[],
): string {
  if (item.type === "link" || item.type === "bulk_orders") {
    return item.label ?? "LINK";
  }

  if (item.type === "category") {
    return (
      categories.find((category) => category.id === item.id)?.name ??
      "Select category"
    );
  }

  return (
    subcategories.find(
      (subcategory) => subcategory.id === item.id,
    )?.name ?? "Select subcategory"
  );
}

export default function NavbarModificationManager({
  initialConfig,
  categories,
  subcategories,
}: Props) {
  const [config, setConfig] =
    useState<NavbarCustomizationConfig>(() => ({
      ...initialConfig,
      items: [...initialConfig.items],
    }));

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeCategories = useMemo(
    () => categories.filter((category) => category.is_active),
    [categories],
  );

  const activeSubcategories = useMemo(
    () =>
      subcategories.filter(
        (subcategory) => subcategory.is_active,
      ),
    [subcategories],
  );

  function clearStatus() {
    setMessage("");
    setError("");
  }

  function updateItem(index: number, changes: Partial<NavbarItem>) {
    clearStatus();

    setConfig((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, ...changes }
          : item,
      ),
    }));
  }

  function addCategory() {
    clearStatus();

    setConfig((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          key: `category:${crypto.randomUUID()}`,
          type: "category",
          id: activeCategories[0]?.id,
        },
      ],
    }));
  }

  function addSubcategory() {
    clearStatus();

    setConfig((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          key: `subcategory:${crypto.randomUUID()}`,
          type: "subcategory",
          id: activeSubcategories[0]?.id,
        },
      ],
    }));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (
      targetIndex < 0 ||
      targetIndex >= config.items.length
    ) {
      return;
    }

    clearStatus();

    setConfig((current) => {
      const next = [...current.items];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return { ...current, items: next };
    });
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) {
    event.preventDefault();

    if (
      draggedIndex === null ||
      draggedIndex === targetIndex
    ) {
      setDraggedIndex(null);
      return;
    }

    clearStatus();

    setConfig((current) => {
      const next = [...current.items];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);
      return { ...current, items: next };
    });

    setDraggedIndex(null);
  }

  async function save() {
    setSaving(true);
    clearStatus();

    try {
      const supabase = createClient();
      const payload = JSON.stringify(config);

      const { data: existing, error: readError } =
        await supabase
          .from("homepage_sections")
          .select("id")
          .eq("section_key", NAVBAR_CUSTOMIZATION_KEY)
          .maybeSingle();

      if (readError) {
        throw readError;
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from("homepage_sections")
          .update({
            section_type: "navbar_customization",
            description: payload,
            is_active: true,
          })
          .eq("id", existing.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from("homepage_sections")
          .insert({
            section_key: NAVBAR_CUSTOMIZATION_KEY,
            section_type: "navbar_customization",
            description: payload,
            display_order: 997,
            is_active: true,
          });

        if (insertError) {
          throw insertError;
        }
      }

      setMessage("Navbar configuration saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? `Failed to save: ${err.message}`
          : "Failed to save navbar configuration.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
          Products
        </p>

        <h1 className="mt-1 text-3xl font-semibold">
          Navbar Modification
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Configure the storefront navigation items and their
          display order.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gray-50 px-6 py-4">
          <div>
            <h2 className="font-semibold">Navbar Items</h2>
            <p className="mt-1 text-xs text-gray-500">
              Drag items or use the arrow buttons to change their
              order.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addCategory}
              disabled={activeCategories.length === 0}
              className="rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Add Category
            </button>

            <button
              type="button"
              onClick={addSubcategory}
              disabled={activeSubcategories.length === 0}
              className="rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Add Subcategory
            </button>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Navbar"}
            </button>
          </div>
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
          {config.items.map((item, index) => {
            const isFixed =
              item.type === "bulk_orders";

            return (
              <div
                key={item.key}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) =>
                  handleDrop(event, index)
                }
                onDragEnd={() => setDraggedIndex(null)}
                className={`flex items-start gap-4 px-6 py-5 transition ${
                  draggedIndex === index
                    ? "opacity-40"
                    : "opacity-100"
                }`}
              >
                <div
                  className="cursor-grab select-none pt-2 text-xl text-gray-400 active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  ⋮⋮
                </div>

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                      {item.type === "category"
                        ? "Category"
                        : item.type === "subcategory"
                          ? "Subcategory"
                          : item.type === "bulk_orders"
                            ? "Fixed Link"
                            : "Link"}
                    </span>

                    {isFixed && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-500">
                        Fixed
                      </span>
                    )}
                  </div>

                  {item.type === "category" && (
                    <select
                      value={item.id ?? ""}
                      onChange={(event) =>
                        updateItem(index, {
                          id: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    >
                      <option value="" disabled>
                        Select category
                      </option>

                      {activeCategories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {item.type === "subcategory" && (
                    <select
                      value={item.id ?? ""}
                      onChange={(event) =>
                        updateItem(index, {
                          id: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    >
                      <option value="" disabled>
                        Select subcategory
                      </option>

                      {activeSubcategories.map(
                        (subcategory) => {
                          const category =
                            categories.find(
                              (candidate) =>
                                candidate.id ===
                                subcategory.category_id,
                            );

                          return (
                            <option
                              key={subcategory.id}
                              value={subcategory.id}
                            >
                              {category
                                ? `${category.name} → `
                                : ""}
                              {subcategory.name}
                            </option>
                          );
                        },
                      )}
                    </select>
                  )}

                  {(item.type === "link" ||
                    item.type === "bulk_orders") && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-500">
                          Display Text
                        </span>

                        <input
                          value={
                            item.label ??
                            itemLabel(
                              item,
                              categories,
                              subcategories,
                            )
                          }
                          onChange={(event) =>
                            updateItem(index, {
                              label: event.target.value,
                            })
                          }
                          disabled={isFixed}
                          className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-500">
                          Target Link
                        </span>

                        <input
                          value={item.href ?? ""}
                          onChange={(event) =>
                            updateItem(index, {
                              href: event.target.value,
                            })
                          }
                          disabled={isFixed}
                          className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="rounded border px-2 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={
                      index === config.items.length - 1
                    }
                    className="rounded border px-2 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Navbar Appearance
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          These settings are stored with the navbar configuration.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              Brand Font
            </span>

            <input
              value={config.brand_font_family}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  brand_font_family: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              Brand Font Size
            </span>

            <input
              type="number"
              value={config.brand_font_size}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  brand_font_size: Number(event.target.value),
                }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              Brand Font Weight
            </span>

            <input
              value={config.brand_font_weight}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  brand_font_weight: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              Brand Font Style
            </span>

            <input
              value={config.brand_font_style}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  brand_font_style: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              Brand Text Color
            </span>

            <input
              type="color"
              value={config.brand_text_color}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  brand_text_color: event.target.value,
                }))
              }
              className="mt-1 h-10 w-full rounded border"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              Background Color
            </span>

            <input
              type="color"
              value={config.background_color}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  background_color: event.target.value,
                }))
              }
              className="mt-1 h-10 w-full rounded border"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
