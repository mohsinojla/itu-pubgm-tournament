"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  Trash2, Upload, Play, X, ImageIcon, Video, Plus,
  Pencil, Check, ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { compressGalleryImage, formatBytes } from "@/lib/utils/compress";
import type { VideoCompressProgress } from "@/lib/utils/compressVideo";

export interface GallerySection {
  _id: string;
  name: string;
  description?: string;
  order: number;
}

export interface GalleryItem {
  _id: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  caption?: string;
  publicId: string;
  sectionId?: string;
}

interface Props {
  items: GalleryItem[];
  sections: GallerySection[];
  isAdmin: boolean;
}

// ─────────────────────────────────────────────
// Root component — switches between layouts
// ─────────────────────────────────────────────
export default function GalleryGrid({ items, sections, isAdmin }: Props) {
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  return (
    <>
      {isAdmin ? (
        <AdminGalleryView
          items={items}
          sections={sections}
          onPreview={setLightboxItem}
        />
      ) : (
        <PublicGalleryView
          items={items}
          sections={sections}
          onPreview={setLightboxItem}
        />
      )}

      {/* Shared lightbox */}
      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// PUBLIC VIEW — stacked event sections
// ─────────────────────────────────────────────
function PublicGalleryView({
  items,
  sections,
  onPreview,
}: {
  items: GalleryItem[];
  sections: GallerySection[];
  onPreview: (item: GalleryItem) => void;
}) {
  const unsorted = items.filter((i) => !i.sectionId);

  if (items.length === 0) {
    return (
      <div className="text-center py-24 text-[var(--text-2)]">
        <ImageIcon size={56} className="mx-auto mb-4 opacity-25" />
        <p className="font-heading text-xl">No media yet</p>
        <p className="text-sm mt-2">Check back after the tournament begins!</p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {sections.map((section) => {
        const sectionItems = items.filter((i) => i.sectionId === section._id);
        if (sectionItems.length === 0) return null;
        return (
          <EventSection
            key={section._id}
            title={section.name}
            description={section.description}
            items={sectionItems}
            onPreview={onPreview}
          />
        );
      })}

      {unsorted.length > 0 && (
        <EventSection
          title="Other Media"
          items={unsorted}
          onPreview={onPreview}
        />
      )}
    </div>
  );
}

function EventSection({
  title,
  description,
  items,
  onPreview,
}: {
  title: string;
  description?: string;
  items: GalleryItem[];
  onPreview: (item: GalleryItem) => void;
}) {
  return (
    <section>
      {/* Section header */}
      <div className="mb-6 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-1 h-7 rounded-full bg-[var(--primary)]" />
          <h2 className="font-heading text-2xl font-bold">{title}</h2>
          <span className="text-xs text-[var(--text-2)] bg-[var(--surface)] border border-[var(--border)] px-2 py-0.5 rounded-full">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>
        {description && (
          <p className="text-sm text-[var(--text-2)] mt-2 ml-4">{description}</p>
        )}
      </div>

      {/* Masonry grid */}
      <MediaGrid items={items} onPreview={onPreview} />
    </section>
  );
}

// ─────────────────────────────────────────────
// ADMIN VIEW — per-event management
// ─────────────────────────────────────────────
function AdminGalleryView({
  items,
  sections,
  onPreview,
}: {
  items: GalleryItem[];
  sections: GallerySection[];
  onPreview: (item: GalleryItem) => void;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  async function createEvent() {
    if (!newName.trim()) { toast.error("Event name is required"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/gallery-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Event created");
        setShowCreate(false);
        setNewName("");
        setNewDesc("");
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to create event");
      }
    } finally {
      setCreating(false);
    }
  }

  const unsorted = items.filter((i) => !i.sectionId);

  return (
    <div className="space-y-8">
      {/* Top actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-2)]">
          {sections.length} event{sections.length !== 1 ? "s" : ""} · {items.length} media items
        </p>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={14} className="mr-1.5" /> New Event
        </Button>
      </div>

      {/* Create event form */}
      {showCreate && (
        <div className="game-card p-5 space-y-3 max-w-lg border border-[var(--primary)]/20">
          <h3 className="font-heading font-bold text-[var(--text-1)]">Create New Event</h3>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createEvent()}
            placeholder="Event name (e.g. Domination Cup 2024)"
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" loading={creating} onClick={createEvent}>Create Event</Button>
          </div>
        </div>
      )}

      {sections.length === 0 && !showCreate && (
        <div className="text-center py-16 text-[var(--text-2)]">
          <ImageIcon size={48} className="mx-auto mb-3 opacity-25" />
          <p className="font-heading text-lg">No events yet</p>
          <p className="text-sm mt-1">Create an event first, then upload media to it.</p>
        </div>
      )}

      {/* Event cards */}
      {sections.map((section) => (
        <AdminEventCard
          key={section._id}
          section={section}
          items={items.filter((i) => i.sectionId === section._id)}
          onPreview={onPreview}
        />
      ))}

      {/* Unsorted media */}
      {unsorted.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-[var(--text-2)] text-sm uppercase tracking-wide">
            Unsorted Media ({unsorted.length})
          </h3>
          <MediaGrid items={unsorted} onPreview={onPreview} isAdmin />
        </div>
      )}
    </div>
  );
}

function AdminEventCard({
  section,
  items,
  onPreview,
}: {
  section: GallerySection;
  items: GalleryItem[];
  onPreview: (item: GalleryItem) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const [savingName, setSavingName] = useState(false);

  async function saveName() {
    if (!editName.trim() || editName.trim() === section.name) { setEditing(false); return; }
    setSavingName(true);
    try {
      const res = await fetch(`/api/admin/gallery-sections/${section._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Renamed"); setEditing(false); router.refresh(); }
      else toast.error(data.error ?? "Failed");
    } finally {
      setSavingName(false);
    }
  }

  async function deleteEvent() {
    if (!confirm(`Delete event "${section.name}"? Media in it will become unsorted.`)) return;
    const res = await fetch(`/api/admin/gallery-sections/${section._id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Event deleted"); router.refresh(); }
    else toast.error(data.error ?? "Failed");
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
      {/* Event header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="w-1 h-6 rounded-full bg-[var(--primary)] shrink-0" />

        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditing(false); }}
              className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--primary)] bg-[var(--bg)] text-sm focus:outline-none"
            />
            <button onClick={saveName} disabled={savingName} className="p-1.5 text-[var(--success)] hover:bg-[var(--success)]/10 rounded-lg">
              <Check size={15} />
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 text-[var(--text-2)] hover:bg-[var(--surface)] rounded-lg">
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-heading font-bold text-lg truncate">{section.name}</h3>
            <span className="text-xs text-[var(--text-2)] shrink-0">{items.length} items</span>
          </div>
        )}

        <div className="flex items-center gap-1 ml-auto shrink-0">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              title="Rename event"
              className="p-1.5 rounded-lg text-[var(--text-2)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
            >
              <Pencil size={14} />
            </button>
          )}
          <button
            onClick={() => setShowUpload(!showUpload)}
            title="Upload to this event"
            className={`p-1.5 rounded-lg transition-colors ${showUpload ? "text-[var(--primary)] bg-[var(--primary)]/10" : "text-[var(--text-2)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10"}`}
          >
            <Upload size={14} />
          </button>
          <button
            onClick={deleteEvent}
            title="Delete event"
            className="p-1.5 rounded-lg text-[var(--text-2)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-[var(--text-2)] hover:bg-[var(--surface)] transition-colors"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--card)]/30">
          <UploadPanel
            sectionId={section._id}
            onDone={() => { setShowUpload(false); router.refresh(); }}
          />
        </div>
      )}

      {/* Media grid */}
      {expanded && (
        <div className="p-5">
          {items.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-2)] text-sm">
              No media yet. Click <Upload size={12} className="inline" /> above to upload.
            </div>
          ) : (
            <MediaGrid items={items} onPreview={onPreview} isAdmin />
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// UPLOAD PANEL — with image & video compression
// ─────────────────────────────────────────────
function UploadPanel({
  sectionId,
  onDone,
}: {
  sectionId: string;
  onDone: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<"idle" | "compressing" | "uploading" | "done">("idle");
  const [compressProgress, setCompressProgress] = useState<VideoCompressProgress | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [finalSize, setFinalSize] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);

  const isVideo = selectedFile?.type.startsWith("video/") ?? false;
  const busy = status === "compressing" || status === "uploading";

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_IMG = 20 * 1024 * 1024;
    const MAX_VID = 500 * 1024 * 1024;
    const isVid = file.type.startsWith("video/");

    if (isVid && file.size > MAX_VID) {
      toast.error("Video must be under 500 MB before compression.");
      return;
    }
    if (!isVid && file.size > MAX_IMG) {
      toast.error("Image must be under 20 MB.");
      return;
    }

    setSelectedFile(file);
    setOriginalSize(file.size);
    setFinalSize(file.size);
    setWarning(null);
    setCompressProgress(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  }

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setWarning(null);
    let fileToUpload = selectedFile;

    // ── Compression ──────────────────────────────────────
    setStatus("compressing");

    if (isVideo) {
      try {
        setCompressProgress({ stage: "loading", pct: 0 });
        const { compressVideo } = await import("@/lib/utils/compressVideo");
        const result = await compressVideo(fileToUpload, (p) => setCompressProgress(p));
        fileToUpload = result.file;
        if (result.warning) setWarning(result.warning);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Video compression failed");
        setStatus("idle");
        return;
      }
    } else {
      fileToUpload = await compressGalleryImage(fileToUpload);
    }

    setFinalSize(fileToUpload.size);

    // ── Upload to Cloudinary ─────────────────────────────
    setStatus("uploading");
    try {
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder: "gallery",
          resourceType: isVideo ? "video" : "image",
        }),
      });
      const sig = await sigRes.json();
      if (!sig.signature) throw new Error("Could not get upload signature");

      const form = new FormData();
      form.append("file", fileToUpload);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      if (isVideo) form.append("resource_type", "video");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/${isVideo ? "video" : "image"}/upload`,
        { method: "POST", body: form }
      );
      const uploadData = await uploadRes.json();
      if (!uploadData.secure_url) throw new Error("Upload failed");

      const saveRes = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isVideo ? "video" : "image",
          url: uploadData.secure_url,
          publicId: uploadData.public_id,
          thumbnail: isVideo ? (uploadData.thumbnail_url ?? undefined) : undefined,
          caption: caption.trim() || undefined,
          sectionId,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveData.success) throw new Error(saveData.error);

      toast.success("Uploaded!");
      setStatus("done");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setStatus("idle");
    }
  }, [selectedFile, isVideo, caption, sectionId, onDone]);

  const progressLabel = (() => {
    if (status === "compressing" && compressProgress) {
      const labels: Record<VideoCompressProgress["stage"], string> = {
        loading: "Loading compressor…",
        preparing: "Preparing video…",
        compressing: "Compressing…",
        done: "Compressed",
      };
      return `${labels[compressProgress.stage]} ${compressProgress.pct}%`;
    }
    if (status === "uploading") return "Uploading…";
    return null;
  })();

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !busy && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${busy ? "opacity-50 cursor-not-allowed border-[var(--border)]" : "cursor-pointer border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5"}`}
      >
        {preview && selectedFile ? (
          <div className="space-y-2">
            {selectedFile.type.startsWith("video/") ? (
              <video src={preview} className="max-h-36 mx-auto rounded-lg" />
            ) : (
              <div className="relative h-36 rounded-lg overflow-hidden">
                <Image src={preview} alt="Preview" fill className="object-contain" />
              </div>
            )}
            <p className="text-xs text-[var(--text-2)]">
              {selectedFile.name} · {formatBytes(originalSize)}
              {finalSize !== originalSize && finalSize > 0 && (
                <span className="text-[var(--success)]"> → {formatBytes(finalSize)}</span>
              )}
            </p>
          </div>
        ) : (
          <div className="text-[var(--text-2)]">
            <div className="flex justify-center gap-3 mb-2 opacity-50">
              <ImageIcon size={22} />
              <Video size={22} />
            </div>
            <p className="text-sm font-medium">Click to select image or video</p>
            <p className="text-xs mt-1 opacity-70">
              Images auto-compressed to &lt; 1 MB · Videos to &lt; 5 MB · Max input: 20 MB / 500 MB
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Caption */}
      <input
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption (optional)"
        disabled={busy}
        className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors disabled:opacity-50"
      />

      {/* Progress bar */}
      {progressLabel && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-[var(--text-2)]">
            <span>{progressLabel}</span>
            {compressProgress && <span>{compressProgress.pct}%</span>}
          </div>
          <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] transition-all duration-200"
              style={{ width: `${status === "uploading" ? 100 : (compressProgress?.pct ?? 0)}%` }}
            />
          </div>
        </div>
      )}

      {/* Warning */}
      {warning && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-400">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{warning}</span>
        </div>
      )}

      {/* Upload button */}
      <Button
        className="w-full"
        disabled={!selectedFile || busy}
        loading={busy}
        onClick={handleUpload}
      >
        {busy ? progressLabel ?? "Working…" : "Upload"}
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared: masonry media grid
// ─────────────────────────────────────────────
function MediaGrid({
  items,
  onPreview,
  isAdmin = false,
}: {
  items: GalleryItem[];
  onPreview: (item: GalleryItem) => void;
  isAdmin?: boolean;
}) {
  const router = useRouter();

  async function deleteItem(id: string) {
    if (!confirm("Delete this media item?")) return;
    const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Deleted"); router.refresh(); }
    else toast.error(data.error ?? "Delete failed");
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
      {items.map((item) => (
        <div
          key={item._id}
          className="break-inside-avoid relative group cursor-pointer rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]"
          onClick={() => onPreview(item)}
        >
          {item.type === "image" ? (
            <Image
              src={item.url}
              alt={item.caption ?? "Gallery image"}
              width={600}
              height={450}
              className="w-full h-auto object-cover"
            />
          ) : (
            <div className="relative aspect-video bg-black">
              {item.thumbnail ? (
                <Image src={item.thumbnail} alt={item.caption ?? ""} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--card)]">
                  <Video size={32} className="text-[var(--text-2)]" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                  <Play size={16} className="text-white" fill="white" />
                </div>
              </div>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
            {item.caption && (
              <p className="text-xs text-white font-medium line-clamp-2">{item.caption}</p>
            )}
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); deleteItem(item._id); }}
                className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Lightbox
// ─────────────────────────────────────────────
function Lightbox({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
        onClick={onClose}
      >
        <X size={28} />
      </button>

      <div
        className="max-w-5xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "image" ? (
          <div className="relative max-h-[85vh] overflow-hidden rounded-xl">
            <Image
              src={item.url}
              alt={item.caption ?? ""}
              width={1280}
              height={900}
              className="max-h-[85vh] w-auto object-contain rounded-xl"
            />
          </div>
        ) : (
          <video
            src={item.url}
            controls
            autoPlay
            className="max-h-[85vh] max-w-full rounded-xl"
          />
        )}
        {item.caption && (
          <p className="mt-3 text-sm text-white/70 text-center">{item.caption}</p>
        )}
      </div>
    </div>
  );
}
