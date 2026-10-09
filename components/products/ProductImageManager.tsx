"use client";

import { prepareImageForUpload } from "@/lib/utils/prepare-image-for-upload";

import { ChangeEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ProductImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  created_at: string;
};

type Props = {
  productId: string;
  productName: string;
  images: ProductImage[];
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

function getExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "jpeg") return "jpg";
  if (["jpg", "png", "webp", "gif"].includes(extension ?? "")) {
    return extension;
  }

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";

  return "jpg";
}

function getStoragePath(imageUrl: string | null) {
  if (!imageUrl) return null;

  const marker =
    "/storage/v1/object/public/product-images/";

  const index = imageUrl.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(
    imageUrl.slice(index + marker.length)
  );
}

function sortImages(images: ProductImage[]) {
  return [...images].sort(
    (a, b) => a.display_order - b.display_order
  );
}

export default function ProductImageManager({
  productId,
  productName,
  images: initialImages,
  disabled = false,
}: Props) {
  const supabase = createClient();

  const [images, setImages] = useState(() =>
    sortImages(initialImages)
  );
  const [busyImageId, setBusyImageId] = useState<string | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const availableSlots = Math.max(
    MAX_IMAGES - images.length,
    0
  );

  const orderedImages = useMemo(
    () => sortImages(images),
    [images]
  );

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function validateFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `${file.name}: only JPG, PNG, WebP, and GIF images are supported.`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `${file.name} is larger than 5MB.`
      );
    }
  }

  async function uploadFile(file: File) {
    file = await prepareImageForUpload(file, "product");
    validateFile(file);

    const extension = getExtension(file);
    const filePath =
      `products/${productId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(
        `Failed to upload ${file.name}: ${uploadError.message}`
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return {
      filePath,
      publicUrl,
    };
  }

  async function handleAddImages(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(
      event.target.files ?? []
    );

    event.target.value = "";

    if (!selectedFiles.length) return;

    clearMessages();

    if (availableSlots <= 0) {
      setError(
        `A product can have a maximum of ${MAX_IMAGES} images.`
      );
      return;
    }

    const filesToUpload = selectedFiles.slice(0, availableSlots);

    if (selectedFiles.length > availableSlots) {
      setError(
        `Only ${availableSlots} image${
          availableSlots === 1 ? "" : "s"
        } can be added. Maximum is ${MAX_IMAGES}.`
      );
    }

    setUploading(true);

    const uploadedPaths: string[] = [];
    const createdImages: ProductImage[] = [];

    try {
      let nextOrder =
        orderedImages.length > 0
          ? Math.max(
              ...orderedImages.map(
                (image) => image.display_order
              )
            ) + 1
          : 0;

      for (const file of filesToUpload) {
        const { filePath, publicUrl } =
          await uploadFile(file);

        uploadedPaths.push(filePath);

        const { data, error: imageRecordError } =
          await supabase
            .from("product_images")
            .insert({
              product_id: productId,
              image_url: publicUrl,
              alt_text: productName,
              display_order: nextOrder,
            })
            .select(
              "id, image_url, alt_text, display_order, created_at"
            )
            .single();

        if (imageRecordError || !data) {
          throw new Error(
            imageRecordError?.message ||
              "Failed to save image information."
          );
        }

        createdImages.push(data as ProductImage);
        nextOrder += 1;
      }

      setImages((current) =>
        sortImages([...current, ...createdImages])
      );

      if (!error) {
        setSuccess(
          `${createdImages.length} image${
            createdImages.length === 1 ? "" : "s"
          } added successfully.`
        );
      }
    } catch (uploadError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from("product-images")
          .remove(uploadedPaths);
      }

      if (createdImages.length > 0) {
        await supabase
          .from("product_images")
          .delete()
          .in(
            "id",
            createdImages.map((image) => image.id)
          );
      }

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to add product images."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleReplace(
    image: ProductImage,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    clearMessages();
    setBusyImageId(image.id);

    let newFilePath: string | null = null;

    try {
      const { filePath, publicUrl } =
        await uploadFile(file);

      newFilePath = filePath;

      const { data, error: updateError } =
        await supabase
          .from("product_images")
          .update({
            image_url: publicUrl,
            alt_text: productName,
          })
          .eq("id", image.id)
          .select(
            "id, image_url, alt_text, display_order, created_at"
          )
          .single();

      if (updateError || !data) {
        throw new Error(
          updateError?.message ||
            "Failed to update image information."
        );
      }

      const oldStoragePath = getStoragePath(
        image.image_url
      );

      if (oldStoragePath && oldStoragePath !== newFilePath) {
        const { error: storageError } =
          await supabase.storage
            .from("product-images")
            .remove([oldStoragePath]);

        if (storageError) {
          setImages((current) =>
            current.map((item) =>
              item.id === image.id
                ? (data as ProductImage)
                : item
            )
          );

          setError(
            `Image replaced, but the old file could not be removed: ${storageError.message}`
          );
          return;
        }
      }

      setImages((current) =>
        current.map((item) =>
          item.id === image.id
            ? (data as ProductImage)
            : item
        )
      );

      setSuccess("Product image replaced successfully.");
    } catch (replaceError) {
      if (newFilePath) {
        await supabase.storage
          .from("product-images")
          .remove([newFilePath]);
      }

      setError(
        replaceError instanceof Error
          ? replaceError.message
          : "Failed to replace product image."
      );
    } finally {
      setBusyImageId(null);
    }
  }

  async function handleDelete(image: ProductImage) {
    const confirmed = window.confirm(
      `Delete this image from ${productName}? This cannot be undone.`
    );

    if (!confirmed) return;

    clearMessages();
    setBusyImageId(image.id);

    try {
      const { error: deleteError } = await supabase
        .from("product_images")
        .delete()
        .eq("id", image.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      const storagePath = getStoragePath(image.image_url);

      if (storagePath) {
        const { error: storageError } =
          await supabase.storage
            .from("product-images")
            .remove([storagePath]);

        if (storageError) {
          setImages((current) =>
            current.filter((item) => item.id !== image.id)
          );
          setError(
            `Image record deleted, but the Storage file could not be removed: ${storageError.message}`
          );
        } else {
          setSuccess("Product image deleted successfully.");
        }
      } else {
        setSuccess("Product image deleted successfully.");
      }

      const remaining = orderedImages.filter(
        (item) => item.id !== image.id
      );

      const reindexed = remaining.map(
        (item, index) => ({
          ...item,
          display_order: index,
        })
      );

      const orderChanges = reindexed.filter((item, index) => {
        const original = remaining[index];
        return (
          original.display_order !==
          item.display_order
        );
      });

      if (orderChanges.length > 0) {
        for (const item of orderChanges) {
          const { error: orderError } =
            await supabase
              .from("product_images")
              .update({
                display_order: item.display_order,
              })
              .eq("id", item.id);

          if (orderError) {
            setError(
              `Image deleted, but image ordering could not be fully normalized: ${orderError.message}`
            );
            break;
          }
        }
      }

      setImages(reindexed);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete product image."
      );
    } finally {
      setBusyImageId(null);
    }
  }

  return (
    <section className="rounded-lg border bg-white p-6">
      <div className="mb-5">
        <h3 className="font-semibold">
          Product Images
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Manage up to {MAX_IMAGES} images. The first image
          is the primary product image.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {orderedImages.map((image, index) => {
          const busy = busyImageId === image.id;

          return (
            <div
              key={image.id}
              className="overflow-hidden rounded-md border bg-gray-50"
            >
              <div className="relative">
                <img
                  src={image.image_url}
                  alt={
                    image.alt_text ||
                    `${productName} image ${index + 1}`
                  }
                  className="aspect-square w-full object-cover"
                />

                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded bg-black px-2 py-1 text-xs font-medium text-white">
                    Primary
                  </span>
                )}

                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-medium text-white">
                    Working...
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 p-3">
                <label className="cursor-pointer rounded-md border px-3 py-2 text-xs font-medium hover:bg-gray-100">
                  Replace
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={
                      disabled ||
                      uploading ||
                      busyImageId !== null
                    }
                    onChange={(event) =>
                      handleReplace(image, event)
                    }
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  disabled={
                    disabled ||
                    uploading ||
                    busy
                  }
                  onClick={() =>
                    handleDelete(image)
                  }
                  className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        {availableSlots > 0 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-center hover:bg-gray-100">
            <span className="text-2xl">+</span>

            <span className="mt-2 text-sm font-medium">
              Add Images
            </span>

            <span className="mt-1 px-3 text-xs text-gray-500">
              {availableSlots}{" "}
              {availableSlots === 1
                ? "slot"
                : "slots"}{" "}
              available
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              disabled={
                disabled ||
                uploading ||
                busyImageId !== null
              }
              onChange={handleAddImages}
              className="hidden"
            />
          </label>
        )}
      </div>

      {!orderedImages.length && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          This product currently has no images.
        </p>
      )}

      <p className="mt-4 text-xs text-gray-500">
        The first image is the primary image shown on product
        listings and product detail pages.
      </p>
    </section>
  );
}
