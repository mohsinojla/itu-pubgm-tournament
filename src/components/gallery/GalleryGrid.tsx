"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Trash2, Upload, Play, X, ImageIcon, Video } from "lucide-react";
import Button from "@/components/ui/Button";

interface GalleryItem {
  _id: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  caption?: string;
  publicId: string;
}

interface Props {
  items: GalleryItem[];
  isAdmin: boolean;
}

export default function GalleryGrid({ items, isAdmin }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("File must be under 50MB"); return; }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const isVideo = selectedFile.type.startsWith("video/");

      // Get signed upload params
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "gallery", resourceType: isVideo ? "video" : "image" }),
      });
      const sigData = await sigRes.json();
      if (!sigData.signature) throw new Error("Failed to get upload signature");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("api_key", sigData.apiKey);
      formData.append("timestamp", sigData.timestamp.toString());
      formData.append("signature", sigData.signature);
      formData.append("folder", sigData.folder);
      if (isVideo) formData.append("resource_type", "video");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${isVideo ? "video" : "image"}/upload`,
        { method: "POST", body: formData }
      );
      const uploadData = await uploadRes.json();
      if (!uploadData.secure_url) throw new Error("Upload failed");

      // Save to DB
      const saveRes = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isVideo ? "video" : "image",
          url: uploadData.secure_url,
          publicId: uploadData.public_id,
          thumbnail: isVideo ? uploadData.thumbnail_url : undefined,
          caption: caption.trim() || undefined,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveData.success) throw new Error(saveData.error);

      toast.success("Uploaded successfully!");
      setShowUploadForm(false);
      setSelectedFile(null);
      setCaption("");
      setPreview(null);
      router.refresh();
    } catch (err) {
      toast.error("Upload failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(itemId: string) {
    if (!confirm("Delete this item from the gallery?")) return;
    try {
      const res = await fetch(`/api/gallery/${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast.success("Deleted"); router.refresh(); }
      else toast.error(data.error ?? "Delete failed");
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div>
      {/* Admin upload */}
      {isAdmin && (
        <div className="mb-6">
          {!showUploadForm ? (
            <Button onClick={() => setShowUploadForm(true)} variant="outline">
              <Upload size={16} className="mr-2" />
              Upload Media
            </Button>
          ) : (
            <div className="game-card p-5 space-y-4 max-w-md">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold">Upload to Gallery</h3>
                <button onClick={() => { setShowUploadForm(false); setPreview(null); setSelectedFile(null); }}>
                  <X size={18} className="text-[var(--text-2)]" />
                </button>
              </div>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--primary)] transition-colors"
              >
                {preview ? (
                  selectedFile?.type.startsWith("video/") ? (
                    <video src={preview} className="max-h-40 mx-auto rounded-lg" controls />
                  ) : (
                    <div className="relative h-40 rounded-lg overflow-hidden">
                      <Image src={preview} alt="Preview" fill className="object-contain" />
                    </div>
                  )
                ) : (
                  <div className="text-[var(--text-2)]">
                    <div className="flex justify-center gap-3 mb-2">
                      <ImageIcon size={24} />
                      <Video size={24} />
                    </div>
                    <p className="text-sm">Click to select image or video</p>
                    <p className="text-xs mt-1">Max 50MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />

              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)"
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
              />

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowUploadForm(false); setPreview(null); setSelectedFile(null); }}>Cancel</Button>
                <Button className="flex-1" loading={uploading} disabled={!selectedFile} onClick={handleUpload}>
                  Upload
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gallery grid */}
      {items.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-2)]">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-heading">No media yet</p>
          <p className="text-sm mt-2">Check back after the tournament begins!</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="break-inside-avoid relative group cursor-pointer rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]"
              onClick={() => setLightboxItem(item)}
            >
              {item.type === "image" ? (
                <Image
                  src={item.url}
                  alt={item.caption ?? "Gallery image"}
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="relative aspect-video bg-black">
                  {item.thumbnail ? (
                    <Image src={item.thumbnail} alt={item.caption ?? ""} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video size={40} className="text-[var(--text-2)]" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                      <Play size={20} className="text-white" fill="white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                {item.caption && (
                  <p className="text-sm text-white font-medium">{item.caption}</p>
                )}
                {isAdmin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-lg text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-[var(--primary)] transition-colors"
            onClick={() => setLightboxItem(null)}
          >
            <X size={28} />
          </button>

          <div
            className="max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxItem.type === "image" ? (
              <div className="relative max-h-[80vh] overflow-hidden rounded-xl">
                <Image
                  src={lightboxItem.url}
                  alt={lightboxItem.caption ?? ""}
                  width={1280}
                  height={720}
                  className="max-h-[80vh] w-auto object-contain rounded-xl"
                />
              </div>
            ) : (
              <video
                src={lightboxItem.url}
                controls
                className="max-h-[80vh] max-w-full rounded-xl"
                autoPlay
              />
            )}
            {lightboxItem.caption && (
              <p className="mt-3 text-sm text-white/80 text-center">{lightboxItem.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
