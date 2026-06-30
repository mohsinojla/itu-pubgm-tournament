/**
 * Compresses an image file to stay under maxKB using the Canvas API.
 * - Scales dimensions down to at most maxPx on the longest side
 * - Iteratively reduces JPEG quality until the target size is met
 * - Always returns a JPEG (best compression for photos)
 */
export async function compressImage(file: File, maxKB = 200, maxPx = 1200): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;

        // Scale down large images
        if (width > maxPx || height > maxPx) {
          const ratio = Math.min(maxPx / width, maxPx / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, width, height);

        const targetBytes = maxKB * 1024;
        let quality = 0.85;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Compression failed"));

              if (blob.size <= targetBytes || quality <= 0.1) {
                resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }));
              } else {
                quality = Math.max(0.1, quality - 0.1);
                tryCompress();
              }
            },
            "image/jpeg",
            quality
          );
        };

        tryCompress();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Gallery image compression: < 1 MB target, up to 1920px longest side.
 * If the file is already under 1 MB, returns it unchanged (no re-encoding).
 */
export async function compressGalleryImage(file: File): Promise<File> {
  const ONE_MB = 1024 * 1024;
  if (file.size <= ONE_MB) return file;
  return compressImage(file, 1024, 1920);
}

/** Human-readable file size, e.g. "1.4 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
