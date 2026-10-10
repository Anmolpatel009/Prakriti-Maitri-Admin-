"use client";

import { useState } from "react";

type CategoryOption = {
  id: string;
  name: string;
  is_active: boolean;
};

type SubcategoryOption = {
  id: string;
  category_id: string;
  name: string;
  is_active: boolean;
};

type Props = {
  categories: CategoryOption[];
  subcategories: SubcategoryOption[];
  selectedCategoryId: string;
  selectedSubcategoryId: string;
};

export default function ProductCatalogFilters({
  categories,
  subcategories,
  selectedCategoryId,
  selectedSubcategoryId,
}: Props) {
  const [categoryId, setCategoryId] = useState(selectedCategoryId);
  const [subcategoryId, setSubcategoryId] = useState(selectedSubcategoryId);

  const activeCategories = categories.filter((category) => category.is_active);
  const availableSubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.is_active &&
      Boolean(categoryId) &&
      subcategory.category_id === categoryId
  );

  return (
    <>
      <div>
        <label
          htmlFor="admin-product-category"
          className="mb-1 block text-sm font-medium"
        >
          Category
        </label>
        <select
          id="admin-product-category"
          name="category"
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setSubcategoryId("");
          }}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {activeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="admin-product-subcategory"
          className="mb-1 block text-sm font-medium"
        >
          Subcategory
        </label>
        <select
          id="admin-product-subcategory"
          name="subcategory"
          value={subcategoryId}
          onChange={(event) => setSubcategoryId(event.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
          disabled={!categoryId || availableSubcategories.length === 0}
        >
          <option value="">All subcategories</option>
          {availableSubcategories.map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </option>
          ))}
        </select>
        {categoryId && availableSubcategories.length === 0 && (
          <p className="mt-1 text-xs text-gray-500">
            No active subcategories for this category.
          </p>
        )}
      </div>
    </>
  );
}