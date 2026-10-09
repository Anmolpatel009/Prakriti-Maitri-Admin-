export type ImageOptimizationProfile =
  | "banner"
  | "navigation"
  | "category"
  | "product"
  | "content";

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const DIMENSIONS: Record<
  ImageOptimizationProfile,
  { width: number; height: number }
> = {
  banner: { width: 1920, height: 1200 },
  navigation: { width: 640, height: 640 },
  category: { width: 1024, height: 1024 },
  product: { width: 1600, height: 1600 },
  content: { width: 1600, height: 1600 },
};

function requireUploadableOriginal(file: File): File {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `${file.name} could not be optimized below 5 MB. Please choose a smaller image.`,
    );
  }

  return file;
}

function containsAscii(bytes: Uint8Array, marker: string): boolean {
  const target = Array.from(marker, (character) => character.charCodeAt(0));

  outer: for (let i = 0; i <= bytes.length - target.length; i++) {
    for (let j = 0; j < target.length; j++) {
      if (bytes[i + j] !== target[j]) continue outer;
    }

    return true;
  }

  return false;
}

async function isAnimatedImage(file: File): Promise<boolean> {
  // Never flatten animated GIFs.
  if (file.type === "image/gif") return true;

  // APNG and animated WebP are left unchanged to preserve their animation.
  if (file.type !== "image/png" && file.type !== "image/webp") {
    return false;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (file.type === "image/png") {
    return containsAscii(bytes, "acTL");
  }

  return containsAscii(bytes, "ANIM") || containsAscii(bytes, "ANMF");
}

function encodeWebP(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });
}

export async function prepareImageForUpload(
  file: File,
  profile: ImageOptimizationProfile,
): Promise<File> {
  // Videos and other non-image files are never modified.
  if (!file.type.startsWith("image/")) return file;

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(`${file.name} exceeds the 25 MB source-image limit.`);
  }

  // Preserve unsupported formats rather than changing their behavior.
  if (
    !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
      file.type,
    )
  ) {
    return requireUploadableOriginal(file);
  }

  try {
    if (await isAnimatedImage(file)) {
      return requireUploadableOriginal(file);
    }
  } catch {
    // If animation detection fails, do not risk flattening an animation.
    return requireUploadableOriginal(file);
  }

  let bitmap: ImageBitmap | undefined;

  try {
    bitmap = await createImageBitmap(file);

    const limits = DIMENSIONS[profile];
    const scale = Math.min(
      1,
      limits.width / bitmap.width,
      limits.height / bitmap.height,
    );

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: true });

    if (!context) {
      return requireUploadableOriginal(file);
    }

    // Preserve aspect ratio and transparency without upscaling.
    context.drawImage(bitmap, 0, 0, width, height);

    for (const quality of [0.9, 0.86, 0.82, 0.78, 0.74]) {
      const blob = await encodeWebP(canvas, quality);

      // Do not create a WebP filename if WebP encoding is unsupported.
      if (!blob || blob.type !== "image/webp") {
        return requireUploadableOriginal(file);
      }

      if (blob.size < file.size && blob.size <= MAX_UPLOAD_BYTES) {
        const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

        return new File([blob], `${baseName}.webp`, {
          type: "image/webp",
          lastModified: file.lastModified,
        });
      }
    }

    return requireUploadableOriginal(file);
  } catch {
    // Never silently allow an image exceeding the existing 5 MB upload cap.
    return requireUploadableOriginal(file);
  } finally {
    bitmap?.close();
  }
}
