"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProductCardStylingConfig } from "@/lib/admin/product-card-modification/queries";

const PRODUCT_CARD_STYLING_KEY = "product_card_styling";

const FONT_CHOICES = [
  ["Georgia, serif", "Georgia"],
  ["Times New Roman, serif", "Times New Roman"],
  [
    "Palatino Linotype, Book Antiqua, Palatino, serif",
    "Palatino",
  ],
  ["Garamond, serif", "Garamond"],
  ["Baskerville, serif", "Baskerville"],
  ["Arial, sans-serif", "Arial"],
  ["Helvetica, Arial, sans-serif", "Helvetica"],
  ["Verdana, sans-serif", "Verdana"],
  ["Trebuchet MS, sans-serif", "Trebuchet MS"],
  ["Tahoma, sans-serif", "Tahoma"],
  ["Arial Narrow, Arial, sans-serif", "Arial Narrow"],
  ["Impact, fantasy", "Impact"],
  ["Courier New, monospace", "Courier New"],
  ["Lucida Console, monospace", "Lucida Console"],
  ["system-ui, sans-serif", "System UI"],
] as const;

const ANIMATIONS = [
  ["fade-in", "Fade In"],
  ["slide-up", "Slide Up"],
  ["scale-in", "Scale In"],
] as const;

export default function ProductCardModificationManager({
  initialConfig,
}: {
  initialConfig: ProductCardStylingConfig;
}) {
  const [config, setConfig] =
    useState<ProductCardStylingConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save(): Promise<void> {
    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();

      const payload = JSON.stringify(config);

      const { data: existing, error: readError } = await supabase
        .from("homepage_sections")
        .select("id")
        .eq("section_key", PRODUCT_CARD_STYLING_KEY)
        .maybeSingle();

      if (readError) throw readError;

      if (existing) {
        const { error } = await supabase
          .from("homepage_sections")
          .update({
            section_type: "product_card_styling",
            description: payload,
            is_active: true,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("homepage_sections")
          .insert({
            section_key: PRODUCT_CARD_STYLING_KEY,
            section_type: "product_card_styling",
            description: payload,
            display_order: 998,
            is_active: true,
          });

        if (error) throw error;
      }

      setMessage("Product card styling saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Failed to save: ${error.message}`
          : "Failed to save product card styling.",
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
          Product Card Modification
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Control the global visual style used by product cards on the
          storefront.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Product Card Style
          </h2>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">
                Font / Typeface — 15 choices
              </span>

              <select
                value={config.font_family}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    font_family: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                {FONT_CHOICES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-500">
                Text Size
              </span>

              <div className="mt-1 flex items-center gap-3">
                <input
                  type="range"
                  min="12"
                  max="32"
                  value={config.font_size}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      font_size: Number(event.target.value),
                    }))
                  }
                  className="w-full"
                />

                <span className="w-14 rounded border px-2 py-1 text-center text-sm">
                  {config.font_size}px
                </span>
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-gray-500">
                  Text Color
                </span>

                <input
                  type="color"
                  value={config.text_color}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      text_color: event.target.value,
                    }))
                  }
                  className="mt-1 h-10 w-full rounded border"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-500">
                  Card Color
                </span>

                <input
                  type="color"
                  value={config.card_color}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      card_color: event.target.value,
                    }))
                  }
                  className="mt-1 h-10 w-full rounded border"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-gray-500">
                Incoming Animation — 3 choices
              </span>

              <select
                value={config.animation}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    animation:
                      event.target.value as ProductCardStylingConfig["animation"],
                  }))
                }
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                {ANIMATIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-7 rounded-lg bg-[#4A5D23] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Product Card Style"}
          </button>

          {message ? (
            <p className="mt-3 text-sm text-gray-600">
              {message}
            </p>
          ) : null}
        </section>

        <aside className="rounded-2xl border bg-gray-50 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Preview
          </p>

          <div
            className="mx-auto mt-5 max-w-[270px] overflow-hidden rounded-lg border shadow-sm"
            style={{
              backgroundColor: config.card_color,
              color: config.text_color,
              fontFamily: config.font_family,
            }}
          >
            <div className="aspect-square bg-[#F1EEE6]" />

            <div className="p-4 text-center">
              <div
                className="font-semibold"
                style={{ fontSize: `${config.font_size}px` }}
              >
                Cotton Tote Bag
              </div>

              <div className="mt-2 text-sm">
                ★★★★★ &nbsp; 26 reviews
              </div>

              <div className="mt-2 font-semibold">
                ₹32.47
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">
            Product cards will keep the same centered information layout.
          </p>
        </aside>
      </div>
    </div>
  );
}
