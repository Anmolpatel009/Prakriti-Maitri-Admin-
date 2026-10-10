"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const CONFIG_KEY = "checkout_pricing_config";

type Category = { id: string; name: string };
type Subcategory = { id: string; name: string; category_id: string };

type ExtraChargeRule = {
  id: string;
  label: string;
  categoryId: string;
  subcategoryId: string;
  amount: number;
  application: "per_item" | "once_per_order";
  active: boolean;
};

type PromoCode = {
  id: string;
  code: string;
  discountAmount: number;
  active: boolean;
};

type PricingConfig = {
  deliveryFeeAmount: number;
  freeDeliveryThreshold: number | null;
  charges: ExtraChargeRule[];
  promoCodes: PromoCode[];
};

function defaultConfig(): PricingConfig {
  return {
    deliveryFeeAmount: 80,
    freeDeliveryThreshold: 999,
    charges: [],
    promoCodes: [],
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asMoney(value: unknown, fallback = 0): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseConfig(description: string | null | undefined): PricingConfig {
  if (!description) return defaultConfig();

  try {
    const raw: unknown = JSON.parse(description);
    if (!isObject(raw)) return defaultConfig();

    const charges = Array.isArray(raw.charges)
      ? raw.charges.flatMap((item, index): ExtraChargeRule[] => {
          if (!isObject(item)) return [];
          return [{
            id: asText(item.id, `charge-${index}`),
            label: asText(item.label),
            categoryId: asText(item.categoryId),
            subcategoryId: asText(item.subcategoryId),
            amount: asMoney(item.amount),
            application:
              item.application === "once_per_order"
                ? "once_per_order"
                : "per_item",
            active: item.active !== false,
          }];
        })
      : [];

    const promoCodes = Array.isArray(raw.promoCodes)
      ? raw.promoCodes.flatMap((item, index): PromoCode[] => {
          if (!isObject(item)) return [];
          return [{
            id: asText(item.id, `promo-${index}`),
            code: asText(item.code).toUpperCase(),
            discountAmount: asMoney(item.discountAmount),
            active: item.active !== false,
          }];
        })
      : [];

    const threshold =
      raw.freeDeliveryThreshold === null ||
      raw.freeDeliveryThreshold === ""
        ? null
        : asMoney(raw.freeDeliveryThreshold, 999);

    return {
      deliveryFeeAmount: asMoney(raw.deliveryFeeAmount, 80),
      freeDeliveryThreshold: threshold,
      charges,
      promoCodes,
    };
  } catch {
    return defaultConfig();
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-700";
const buttonClass =
  "rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50";
const secondaryButtonClass =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50";

export default function ExtraChargesManager() {
  const [config, setConfig] = useState<PricingConfig>(defaultConfig());
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const [settingsResult, categoryResult, subcategoryResult] =
          await Promise.all([
            supabase
              .from("homepage_sections")
              .select("id,description")
              .eq("section_key", CONFIG_KEY)
              .maybeSingle(),
            supabase
              .from("categories")
              .select("id,name")
              .order("name"),
            supabase
              .from("subcategories")
              .select("id,name,category_id")
              .order("name"),
          ]);

        if (settingsResult.error) throw settingsResult.error;
        if (categoryResult.error) throw categoryResult.error;
        if (subcategoryResult.error) throw subcategoryResult.error;
        if (cancelled) return;

        setConfig(parseConfig(settingsResult.data?.description));
        setCategories((categoryResult.data ?? []) as Category[]);
        setSubcategories((subcategoryResult.data ?? []) as Subcategory[]);
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? `Could not load checkout pricing: ${error.message}`
              : "Could not load checkout pricing settings.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateCharge(id: string, patch: Partial<ExtraChargeRule>) {
    setConfig((old) => ({
      ...old,
      charges: old.charges.map((charge) =>
        charge.id === id ? { ...charge, ...patch } : charge,
      ),
    }));
  }

  function updatePromo(id: string, patch: Partial<PromoCode>) {
    setConfig((old) => ({
      ...old,
      promoCodes: old.promoCodes.map((promo) =>
        promo.id === id ? { ...promo, ...patch } : promo,
      ),
    }));
  }

  function addCharge() {
    setConfig((old) => ({
      ...old,
      charges: [
        ...old.charges,
        {
          id: makeId("charge"),
          label: "",
          categoryId: "",
          subcategoryId: "",
          amount: 0,
          application: "per_item",
          active: true,
        },
      ],
    }));
  }

  function addPromo() {
    setConfig((old) => ({
      ...old,
      promoCodes: [
        ...old.promoCodes,
        {
          id: makeId("promo"),
          code: "",
          discountAmount: 0,
          active: true,
        },
      ],
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (
      !Number.isFinite(config.deliveryFeeAmount) ||
      config.deliveryFeeAmount < 0
    ) {
      setMessage("Delivery charge must be zero or a positive amount.");
      return;
    }

    if (
      config.freeDeliveryThreshold !== null &&
      (!Number.isFinite(config.freeDeliveryThreshold) ||
        config.freeDeliveryThreshold < 0)
    ) {
      setMessage("Free-delivery threshold must be non-negative or left blank.");
      return;
    }

    for (const [index, charge] of config.charges.entries()) {
      if (!charge.label.trim()) {
        setMessage(`Extra charge ${index + 1}: enter a charge name.`);
        return;
      }
      if (!charge.categoryId) {
        setMessage(`Extra charge ${index + 1}: select a category.`);
        return;
      }
      if (!Number.isFinite(charge.amount) || charge.amount <= 0) {
        setMessage(`Extra charge ${index + 1}: amount must be greater than zero.`);
        return;
      }
      if (
        charge.subcategoryId &&
        !subcategories.some(
          (sub) =>
            sub.id === charge.subcategoryId &&
            sub.category_id === charge.categoryId,
        )
      ) {
        setMessage(`Extra charge ${index + 1}: the selected subcategory does not belong to that category.`);
        return;
      }
    }

    const normalizedPromos = config.promoCodes.map((promo) => ({
      ...promo,
      code: promo.code.trim().toUpperCase(),
    }));

    if (normalizedPromos.some((promo) => !promo.code)) {
      setMessage("Every promo code must have a code value.");
      return;
    }
    if (
      normalizedPromos.some(
        (promo) =>
          !Number.isFinite(promo.discountAmount) ||
          promo.discountAmount <= 0,
      )
    ) {
      setMessage("Every promo discount must be greater than zero.");
      return;
    }

    const uniqueCodes = normalizedPromos.map((promo) => promo.code);
    if (new Set(uniqueCodes).size !== uniqueCodes.length) {
      setMessage("Promo codes must be unique, ignoring letter case.");
      return;
    }

    setSaving(true);
    try {
      const payload: PricingConfig = {
        deliveryFeeAmount: Math.round(config.deliveryFeeAmount * 100) / 100,
        freeDeliveryThreshold:
          config.freeDeliveryThreshold === null
            ? null
            : Math.round(config.freeDeliveryThreshold * 100) / 100,
        charges: config.charges.map((charge) => ({
          ...charge,
          label: charge.label.trim(),
          amount: Math.round(charge.amount * 100) / 100,
        })),
        promoCodes: normalizedPromos.map((promo) => ({
          ...promo,
          discountAmount: Math.round(promo.discountAmount * 100) / 100,
        })),
      };

      const supabase = createClient();
      const { data: existing, error: lookupError } = await supabase
        .from("homepage_sections")
        .select("id")
        .eq("section_key", CONFIG_KEY)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (existing?.id) {
        const { error } = await supabase
          .from("homepage_sections")
          .update({
            title: "Checkout Pricing",
            section_type: "checkout_pricing_config",
            description: JSON.stringify(payload),
            display_order: 990,
            is_active: true,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("homepage_sections").insert({
          section_key: CONFIG_KEY,
          title: "Checkout Pricing",
          section_type: "checkout_pricing_config",
          description: JSON.stringify(payload),
          display_order: 990,
          is_active: true,
        });
        if (error) throw error;
      }

      setConfig(payload);
      setMessage("Checkout pricing settings saved successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Save failed: ${error.message}`
          : "Save failed. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="mt-6 rounded-xl border bg-white p-6">
        Loading checkout pricing settings…
      </section>
    );
  }

  return (
    <form onSubmit={save} className="mt-6 space-y-6">
      {message && (
        <p role="status" className="rounded-lg border bg-white p-3 text-sm text-gray-800">
          {message}
        </p>
      )}

      <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Delivery charge</h2>
        <p className="mt-1 text-sm text-gray-500">
          The current checkout rule is ₹80 below a ₹999 subtotal and free at or above ₹999.
          These settings are stored here for the separate Shop integration.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Standard delivery charge (₹)
            <input
              type="number"
              min="0"
              step="0.01"
              required
              className={inputClass}
              value={config.deliveryFeeAmount}
              onChange={(event) =>
                setConfig((old) => ({
                  ...old,
                  deliveryFeeAmount: Number(event.target.value),
                }))
              }
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Free delivery subtotal threshold (₹)
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={config.freeDeliveryThreshold ?? ""}
              placeholder="Leave blank to disable free delivery"
              onChange={(event) =>
                setConfig((old) => ({
                  ...old,
                  freeDeliveryThreshold:
                    event.target.value.trim() === ""
                      ? null
                      : Number(event.target.value),
                }))
              }
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Extra charges</h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure an extra fee for a category or a specific subcategory.
              Choose whether it applies per matching item or once per order.
            </p>
          </div>
          <button type="button" className={secondaryButtonClass} onClick={addCharge}>
            + Add charge
          </button>
        </div>

        {config.charges.length === 0 ? (
          <p className="mt-5 rounded-lg border border-dashed p-4 text-sm text-gray-500">
            No extra-charge rules yet. Add one for services such as logo printing on customized bags.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {config.charges.map((charge, index) => {
              const matchingSubcategories = subcategories.filter(
                (subcategory) => subcategory.category_id === charge.categoryId,
              );

              return (
                <div key={charge.id} className="rounded-lg border p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-medium text-gray-900">Charge rule {index + 1}</h3>
                    <button
                      type="button"
                      className="text-sm text-red-700 hover:underline"
                      onClick={() =>
                        setConfig((old) => ({
                          ...old,
                          charges: old.charges.filter((item) => item.id !== charge.id),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Charge name
                      <input
                        required
                        className={inputClass}
                        value={charge.label}
                        placeholder="e.g. Logo printing"
                        onChange={(event) => updateCharge(charge.id, { label: event.target.value })}
                      />
                    </label>

                    <label className="block text-sm font-medium text-gray-700">
                      Category
                      <select
                        required
                        className={inputClass}
                        value={charge.categoryId}
                        onChange={(event) =>
                          updateCharge(charge.id, {
                            categoryId: event.target.value,
                            subcategoryId: "",
                          })
                        }
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm font-medium text-gray-700">
                      Subcategory (optional)
                      <select
                        className={inputClass}
                        value={charge.subcategoryId}
                        disabled={!charge.categoryId}
                        onChange={(event) =>
                          updateCharge(charge.id, { subcategoryId: event.target.value })
                        }
                      >
                        <option value="">Entire selected category</option>
                        {matchingSubcategories.map((subcategory) => (
                          <option key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm font-medium text-gray-700">
                      Extra amount (₹)
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        className={inputClass}
                        value={charge.amount}
                        onChange={(event) =>
                          updateCharge(charge.id, { amount: Number(event.target.value) })
                        }
                      />
                    </label>

                    <label className="block text-sm font-medium text-gray-700">
                      How to apply
                      <select
                        className={inputClass}
                        value={charge.application}
                        onChange={(event) =>
                          updateCharge(charge.id, {
                            application:
                              event.target.value === "once_per_order"
                                ? "once_per_order"
                                : "per_item",
                          })
                        }
                      >
                        <option value="per_item">Per matching item (including quantity)</option>
                        <option value="once_per_order">Once per order</option>
                      </select>
                    </label>

                    <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={charge.active}
                        onChange={(event) => updateCharge(charge.id, { active: event.target.checked })}
                      />
                      Rule active
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Promo codes</h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure fixed rupee discounts. The Shop phase will validate and apply them server-side.
            </p>
          </div>
          <button type="button" className={secondaryButtonClass} onClick={addPromo}>
            + Add promo code
          </button>
        </div>

        {config.promoCodes.length === 0 ? (
          <p className="mt-5 rounded-lg border border-dashed p-4 text-sm text-gray-500">
            No promo codes yet.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {config.promoCodes.map((promo, index) => (
              <div key={promo.id} className="grid gap-4 rounded-lg border p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
                <label className="block text-sm font-medium text-gray-700">
                  Promo code
                  <input
                    required
                    className={inputClass}
                    value={promo.code}
                    placeholder="e.g. DIWALI100"
                    onChange={(event) => updatePromo(promo.id, { code: event.target.value.toUpperCase() })}
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Discount amount (₹)
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    className={inputClass}
                    value={promo.discountAmount}
                    onChange={(event) => updatePromo(promo.id, { discountAmount: Number(event.target.value) })}
                  />
                </label>

                <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={promo.active}
                    onChange={(event) => updatePromo(promo.id, { active: event.target.checked })}
                  />
                  Active
                </label>

                <button
                  type="button"
                  className="pb-2 text-left text-sm text-red-700 hover:underline"
                  onClick={() =>
                    setConfig((old) => ({
                      ...old,
                      promoCodes: old.promoCodes.filter((item) => item.id !== promo.id),
                    }))
                  }
                >
                  Remove
                </button>
                <span className="text-xs text-gray-400 md:col-span-4">
                  Promo rule {index + 1}. Duplicate codes are not allowed.
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-gray-50 p-4">
        <p className="max-w-2xl text-sm text-gray-600">
          Saving here stores configuration only. Customer totals and payment amounts will remain unchanged
          until the separate Shop implementation is completed and validated.
        </p>
        <button type="submit" disabled={saving} className={buttonClass}>
          {saving ? "Saving…" : "Save checkout pricing"}
        </button>
      </div>
    </form>
  );
}