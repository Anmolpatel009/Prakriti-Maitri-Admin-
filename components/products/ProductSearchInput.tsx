"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

type ProductSuggestion = {
  id: string;
  name: string;
  sku: string | null;
};

type SuggestionsResponse = {
  products?: ProductSuggestion[];
};

export default function ProductSearchInput({
  defaultValue,
}: {
  defaultValue: string;
}) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [shouldSuggest, setShouldSuggest] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requestFailed, setRequestFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = "admin-product-search-suggestions";

  useEffect(() => {
    const term = query.trim();

    if (!shouldSuggest || term.length < 2) {
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setRequestFailed(false);

        try {
          const response = await fetch(
            `/api/admin/products/suggestions?q=${encodeURIComponent(term)}`,
            {
              signal: controller.signal,
              cache: "no-store",
            }
          );

          if (!response.ok) {
            throw new Error("Product suggestions request failed.");
          }

          const payload =
            (await response.json()) as SuggestionsResponse;
          const results = Array.isArray(payload.products)
            ? payload.products
            : [];

          setSuggestions(results);
          setIsOpen(true);
          setActiveIndex(-1);
        } catch {
          if (!controller.signal.aborted) {
            setSuggestions([]);
            setIsOpen(true);
            setRequestFailed(true);
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        }
      })();
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, shouldSuggest]);

  function chooseProduct(product: ProductSuggestion) {
    const input = inputRef.current;
    const nextQuery = product.name;

    if (input) {
      input.value = nextQuery;
    }

    setQuery(nextQuery);
    setIsOpen(false);
    setShouldSuggest(false);
    setSuggestions([]);
    setActiveIndex(-1);

    // Submit the existing GET form so its category filters are preserved.
    // The form action includes #product-list to keep the results in view.
    input?.form?.requestSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setShouldSuggest(false);
      return;
    }

    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => (index + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1
      );
      return;
    }

    if (
      event.key === "Enter" &&
      isOpen &&
      activeIndex >= 0 &&
      suggestions[activeIndex]
    ) {
      event.preventDefault();
      chooseProduct(suggestions[activeIndex]);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id="admin-product-search"
        name="search"
        type="search"
        value={query}
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          setShouldSuggest(true);
          setIsOpen(value.trim().length >= 2);
          setIsLoading(value.trim().length >= 2);
          if (value.trim().length < 2) {
            setSuggestions([]);
          }
          setRequestFailed(false);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) {
            setShouldSuggest(true);
            setIsOpen(true);
            setIsLoading(true);
          }
        }}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen && query.trim().length >= 2}
        aria-controls={listId}
        aria-activedescendant={
          activeIndex >= 0 && suggestions[activeIndex]
            ? `admin-product-suggestion-${suggestions[activeIndex].id}`
            : undefined
        }
        placeholder="Search by product name or SKU"
        className="w-full rounded-md border px-3 py-2 text-sm"
      />

      {isOpen && query.trim().length >= 2 && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-gray-500">
              Searching products…
            </p>
          ) : requestFailed ? (
            <p className="px-3 py-2 text-sm text-red-600">
              Could not load suggestions. You can still use Filter.
            </p>
          ) : suggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">
              No matching products found.
            </p>
          ) : (
            suggestions.map((product, index) => (
              <button
                key={product.id}
                id={`admin-product-suggestion-${product.id}`}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => chooseProduct(product)}
                className={`block w-full px-3 py-2 text-left hover:bg-gray-50 ${
                  activeIndex === index ? "bg-gray-100" : ""
                }`}
              >
                <span className="block text-sm font-medium text-gray-900">
                  {product.name}
                </span>
                {product.sku && (
                  <span className="mt-0.5 block text-xs text-gray-500">
                    SKU: {product.sku}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}