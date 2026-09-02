"use client";

import { ChangeEvent, useEffect, useState } from "react";

type Props = {
  value: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
};

const MAX_IMAGES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default function ProductImageUploader({
  value,
  onChange,
  disabled = false,
}: Props) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = value.map((file) => URL.createObjectURL(file));

    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [value]);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (!selectedFiles.length) {
      return;
    }

    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(
          `${file.name} is not supported. Use JPG, PNG, WebP, or GIF.`
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} is larger than 5MB.`);
        continue;
      }

      validFiles.push(file);
    }

    const remainingSlots = MAX_IMAGES - value.length;

    if (remainingSlots <= 0) {
      alert(`You can upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      alert(`You can upload a maximum of ${MAX_IMAGES} images.`);
    }

    if (filesToAdd.length > 0) {
      onChange([...value, ...filesToAdd]);
    }

    event.target.value = "";
  }

  function removeImage(index: number) {
    onChange(value.filter((_, fileIndex) => fileIndex !== index));
  }

  return (
    <section className="rounded-lg border bg-white p-6">
      <div className="mb-5">
        <h3 className="font-semibold">Product Images</h3>

        <p className="mt-1 text-sm text-gray-500">
          Upload up to 4 images. JPG, PNG, WebP, or GIF. Maximum 5MB
          each.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {previews.map((preview, index) => (
          <div
            key={`${preview}-${index}`}
            className="relative overflow-hidden rounded-md border bg-gray-50"
          >
            <img
              src={preview}
              alt={`Product image ${index + 1}`}
              className="aspect-square w-full object-cover"
            />

            {index === 0 && (
              <span className="absolute left-2 top-2 rounded bg-black px-2 py-1 text-xs font-medium text-white">
                Primary
              </span>
            )}

            {value[index]?.type === "image/gif" && (
              <span className="absolute bottom-2 left-2 rounded bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow">
                GIF
              </span>
            )}

            <button
              type="button"
              disabled={disabled}
              onClick={() => removeImage(index)}
              className="absolute right-2 top-2 rounded bg-white px-2 py-1 text-xs font-medium text-red-600 shadow disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ))}

        {value.length < MAX_IMAGES && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-center hover:bg-gray-100">
            <span className="text-2xl">+</span>

            <span className="mt-2 text-sm font-medium">
              Add Images
            </span>

            <span className="mt-1 px-3 text-xs text-gray-500">
              JPG · PNG · WebP · GIF
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              disabled={disabled}
              onChange={handleFiles}
              className="hidden"
            />
          </label>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        The first image will be used as the primary product image.
      </p>
    </section>
  );
}