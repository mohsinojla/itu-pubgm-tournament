"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ImageIcon, Trash2, Upload, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { compressGalleryImage } from "@/lib/utils/compress";

export interface PrizeImage {
  _id: string;
  url: string;
  publicId: string;
  caption?: string;
}

export default function PrizePoolImages({
  images,
  isAdmin,
  canDelete = false,
}: {
  images: PrizeImage[];
  isAdmin: boolean;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<PrizeImage | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be under 20 MB.");
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressGalleryImage(file);

      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "prizes", resourceType: "image" }),
      });
      const sig = await sigRes.json();
      if (!sig.signature) throw new Error("Could not get upload signature");

      const form = new FormData();
      form.append("file", compressed);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: "POST", body: form }
      );
      const uploadData = await uploadRes.json();
      if (!uploadData.secure_url) throw new Error("Upload failed");

      const saveRes = await fetch("/api/prize-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: uploadData.secure_url, publicId: uploadData.public_id }),
      });
      const saveData = await saveRes.json();
      if (!saveData.success) throw new Error(saveData.error);

      toast.success("Image added!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(id: string) {
    if (!confirm("Delete this image?")) return;
    const res = await fetch(`/api/prize-images/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Deleted"); router.refresh(); }
    else toast.error(data.error ?? "Delete failed");
  }

  if (images.length === 0 && !isAdmin) return null;

  return (
    <section className="fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ImageIcon size={18} className="text-[var(--primary)]" />
          <h2 className="font-heading text-xl font-bold">Gallery</h2>
        </div>
        {isAdmin && (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <Button size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
              <Upload size={14} className="mr-1.5" /> {uploading ? "Uploading…" : "Add Image"}
            </Button>
          </>
        )}
      </div>

      {images.length === 0 ? (
        <div className="text-center py-10 text-[var(--text-2)] text-sm border border-dashed border-[var(--border)] rounded-2xl">
          No images yet. {isAdmin && "Click “Add Image” to upload."}
        </div>
      ) : (
        <div className="stagger-fade grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={img._id}
              className="relative group aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] cursor-pointer transition-all duration-300 hover:border-[var(--primary-dim)] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5),0_0_20px_rgba(242,163,22,0.12)]"
              onClick={() => setLightbox(img)}
            >
              <Image
                src={img.url}
                alt={img.caption ?? "Prize"}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
              {canDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteImage(img._id); }}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X size={28} />
          </button>
          <div className="relative max-w-5xl max-h-[85vh] w-full h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <Image src={lightbox.url} alt={lightbox.caption ?? ""} fill className="object-contain" />
          </div>
        </div>
      )}
    </section>
  );
}
