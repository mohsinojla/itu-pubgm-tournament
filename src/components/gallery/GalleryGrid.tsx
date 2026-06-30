"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Trash2, Upload, Play, X, ImageIcon, Video, Plus, FolderOpen, Pencil, Check } from "lucide-react";
import Button from "@/components/ui/Button";

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

export default function GalleryGrid({ items, sections, isAdmin }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<string>("all");
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [uploadSectionId, setUploadSectionId] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Section management state
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionDesc, setNewSectionDesc] = useState("");
  const [creatingSection, setCreatingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState("");

  const displayedItems =
    activeSection === "all"
      ? items
      : activeSection === "unsorted"
      ? items.filter((i) => !i.sectionId)
      : items.filter((i) => i.sectionId === activeSection);

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

      const saveRes = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isVideo ? "video" : "image",
          url: uploadData.secure_url,
          publicId: uploadData.public_id,
          thumbnail: isVideo ? uploadData.thumbnail_url : undefined,
          caption: caption.trim() || undefined,
          sectionId: uploadSectionId || undefined,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveData.success) throw new Error(saveData.error);

      toast.success("Uploaded successfully!");
      setShowUploadForm(false);
      setSelectedFile(null);
      setCaption("");
      setUploadSectionId("");
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
    } catch { toast.error("Something went wrong"); }
  }

  async function createSection() {
    if (!newSectionName.trim()) { toast.error("Section name required"); return; }
    setCreatingSection(true);
    try {
      const res = await fetch("/api/admin/gallery-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSectionName.trim(), description: newSectionDesc.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Section created");
        setShowNewSection(false);
        setNewSectionName("");
        setNewSectionDesc("");
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed");
      }
    } finally {
      setCreatingSection(false);
    }
  }

  async function renameSection(sectionId: string) {
    if (!editSectionName.trim()) return;
    try {
      const res = await fetch(`/api/admin/gallery-sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editSectionName.trim() }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Renamed"); setEditingSectionId(null); router.refresh(); }
      else toast.error(data.error ?? "Failed");
    } catch { toast.error("Something went wrong"); }
  }

  async function deleteSection(sectionId: string, name: string) {
    if (!confirm(`Delete section "${name}"? Media in this section will move to unsorted.`)) return;
    try {
      const res = await fetch(`/api/admin/gallery-sections/${sectionId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast.success("Section deleted"); if (activeSection === sectionId) setActiveSection("all"); router.refresh(); }
      else toast.error(data.error ?? "Failed");
    } catch { toast.error("Something went wrong"); }
  }

  return (
    <div className="space-y-6">
      {/* Section tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: "all", label: `All (${items.length})` },
          ...sections.map((s) => ({
            id: s._id,
            label: `${s.name} (${items.filter((i) => i.sectionId === s._id).length})`,
          })),
          ...(items.some((i) => !i.sectionId) ? [{ id: "unsorted", label: `Unsorted (${items.filter((i) => !i.sectionId).length})` }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeSection === tab.id
                ? "bg-[var(--primary)] text-black"
                : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)]"
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Manage sections / upload (admin) */}
        {isAdmin && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowNewSection(!showNewSection)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-2)] hover:border-[var(--primary-dim)] hover:text-[var(--primary)] transition-colors"
            >
              <FolderOpen size={14} /> New Section
            </button>
            <Button onClick={() => setShowUploadForm(true)} variant="outline" size="sm">
              <Upload size={14} className="mr-1.5" /> Upload
            </Button>
          </div>
        )}
      </div>

      {/* Section rename controls (admin, visible when a section tab is active) */}
      {isAdmin && activeSection !== "all" && activeSection !== "unsorted" && (
        <div className="flex items-center gap-2 text-sm">
          {editingSectionId === activeSection ? (
            <>
              <input
                autoFocus
                value={editSectionName}
                onChange={(e) => setEditSectionName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") renameSection(activeSection); if (e.key === "Escape") setEditingSectionId(null); }}
                className="px-3 py-1.5 rounded-lg border border-[var(--primary)] bg-[var(--surface)] text-sm focus:outline-none"
              />
              <button onClick={() => renameSection(activeSection)} className="p-1.5 text-[var(--success)] hover:bg-[var(--success)]/10 rounded-lg"><Check size={14} /></button>
              <button onClick={() => setEditingSectionId(null)} className="p-1.5 text-[var(--text-2)] hover:bg-[var(--surface)] rounded-lg"><X size={14} /></button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setEditingSectionId(activeSection); setEditSectionName(sections.find((s) => s._id === activeSection)?.name ?? ""); }}
                className="flex items-center gap-1 text-[var(--text-2)] hover:text-[var(--primary)] transition-colors"
              >
                <Pencil size={12} /> Rename section
              </button>
              <span className="text-[var(--border)]">·</span>
              <button
                onClick={() => deleteSection(activeSection, sections.find((s) => s._id === activeSection)?.name ?? "")}
                className="text-[var(--danger)] hover:underline"
              >
                Delete section
              </button>
            </>
          )}
        </div>
      )}

      {/* New section form */}
      {isAdmin && showNewSection && (
        <div className="game-card p-5 space-y-3 max-w-md">
          <h3 className="font-heading font-bold">New Gallery Section</h3>
          <input
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            placeholder="Section name (e.g. Domination Cup)"
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
          <input
            value={newSectionDesc}
            onChange={(e) => setNewSectionDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowNewSection(false)}>Cancel</Button>
            <Button size="sm" loading={creatingSection} onClick={createSection}><Plus size={13} className="mr-1" /> Create</Button>
          </div>
        </div>
      )}

      {/* Upload form */}
      {isAdmin && showUploadForm && (
        <div className="game-card p-5 space-y-4 max-w-md">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold">Upload to Gallery</h3>
            <button onClick={() => { setShowUploadForm(false); setPreview(null); setSelectedFile(null); }}>
              <X size={18} className="text-[var(--text-2)]" />
            </button>
          </div>

          {sections.length > 0 && (
            <div>
              <label className="block text-xs text-[var(--text-2)] mb-1.5">Section (optional)</label>
              <select
                value={uploadSectionId}
                onChange={(e) => setUploadSectionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
              >
                <option value="">— Unsorted —</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

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
                <div className="flex justify-center gap-3 mb-2"><ImageIcon size={24} /><Video size={24} /></div>
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
            <Button className="flex-1" loading={uploading} disabled={!selectedFile} onClick={handleUpload}>Upload</Button>
          </div>
        </div>
      )}

      {/* Gallery grid */}
      {displayedItems.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-2)]">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-heading">{activeSection === "all" ? "No media yet" : "No media in this section"}</p>
          <p className="text-sm mt-2">{activeSection === "all" ? "Check back after the tournament begins!" : "Upload media to this section using the Upload button above."}</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {displayedItems.map((item) => (
            <div
              key={item._id}
              className="break-inside-avoid relative group cursor-pointer rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]"
              onClick={() => setLightboxItem(item)}
            >
              {item.type === "image" ? (
                <Image src={item.url} alt={item.caption ?? "Gallery image"} width={800} height={600} className="w-full h-auto object-cover" />
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
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                {item.caption && <p className="text-sm text-white font-medium">{item.caption}</p>}
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
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxItem(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-[var(--primary)] transition-colors" onClick={() => setLightboxItem(null)}>
            <X size={28} />
          </button>
          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {lightboxItem.type === "image" ? (
              <div className="relative max-h-[80vh] overflow-hidden rounded-xl">
                <Image src={lightboxItem.url} alt={lightboxItem.caption ?? ""} width={1280} height={720} className="max-h-[80vh] w-auto object-contain rounded-xl" />
              </div>
            ) : (
              <video src={lightboxItem.url} controls className="max-h-[80vh] max-w-full rounded-xl" autoPlay />
            )}
            {lightboxItem.caption && <p className="mt-3 text-sm text-white/80 text-center">{lightboxItem.caption}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
