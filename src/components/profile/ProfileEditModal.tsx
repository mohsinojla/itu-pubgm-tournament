"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { X, User, Upload } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { completeProfileSchema, type CompleteProfileInput } from "@/lib/validators/user.schema";
import { DEGREE_PROGRAMMES, maxSemesterForDegree } from "@/lib/constants/degrees";

interface Props {
  open: boolean;
  onClose: () => void;
  user: {
    _id: string;
    name?: string;
    photo?: string;
    rollNumber?: string;
    pubgId?: string;
    pubgName?: string;
    gender?: string;
    semester?: number;
    degreeProgramme?: string;
    whatsapp?: string;
  };
}

export default function ProfileEditModal({ open, onClose, user }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photo ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      name: user.name ?? "",
      rollNumber: user.rollNumber ?? "",
      pubgId: user.pubgId ?? "",
      pubgName: user.pubgName ?? "",
      gender: (user.gender as "male" | "female" | "other") ?? "male",
      semester: user.semester ?? 1,
      degreeProgramme: user.degreeProgramme ?? "",
      whatsapp: user.whatsapp ?? "",
    },
  });

  const selectedDegree = watch("degreeProgramme") ?? "";
  const maxSem = selectedDegree ? maxSemesterForDegree(selectedDegree) : 8;
  const SEMESTERS = Array.from({ length: maxSem }, (_, i) => i + 1);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be under 5MB"); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return null;
    const sigRes = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "avatars", resourceType: "image" }),
    });
    const sigData = await sigRes.json();
    if (!sigData.signature) throw new Error("Signature failed");
    const formData = new FormData();
    formData.append("file", photoFile);
    formData.append("api_key", sigData.apiKey);
    formData.append("timestamp", sigData.timestamp);
    formData.append("signature", sigData.signature);
    formData.append("folder", sigData.folder);
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await uploadRes.json();
    return data.secure_url ?? null;
  }

  async function onSubmit(values: CompleteProfileInput) {
    setSaving(true);
    try {
      let photoUrl: string | undefined;
      if (photoFile) photoUrl = await uploadPhoto() ?? undefined;

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, ...(photoUrl && { photo: photoUrl }) }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error ?? "Update failed"); return; }
      toast.success("Profile updated!");
      router.refresh();
      onClose();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg game-card p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-bold">Edit Profile</h2>
          <button onClick={onClose} className="text-[var(--text-2)] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-16 h-16 rounded-full border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] transition-colors bg-[var(--surface)] overflow-hidden group shrink-0"
            >
              {photoPreview ? (
                <Image src={photoPreview} alt="Preview" fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <User size={20} className="text-[var(--text-2)]" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload size={14} className="text-white" />
              </div>
            </button>
            <div>
              <p className="text-sm font-medium">Profile Photo</p>
              <p className="text-xs text-[var(--text-2)]">JPEG or PNG, max 5MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </div>

          <Input label="Full Name" error={errors.name?.message} required {...register("name")} />
          <Input label="Roll Number" error={errors.rollNumber?.message} required {...register("rollNumber")} />
          <Input label="PUBG Mobile ID" error={errors.pubgId?.message} required {...register("pubgId")} />
          <Input label="PUBG In-Game Name" error={errors.pubgName?.message} required {...register("pubgName")} />

          <div>
            <label className="block text-sm font-medium text-[var(--text-2)] mb-1.5">Gender</label>
            <div className="flex gap-4">
              {[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={opt.value} className="accent-[var(--primary)]" {...register("gender")} />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Degree first so semester options update correctly */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-2)] mb-1.5">Degree</label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                {...register("degreeProgramme", {
                  onChange: () => setValue("semester", 1),
                })}
              >
                <option value="">Select</option>
                {DEGREE_PROGRAMMES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.degreeProgramme && (
                <p className="mt-1 text-xs text-[var(--danger)]">{errors.degreeProgramme.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-2)] mb-1.5">Semester</label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                {...register("semester", { valueAsNumber: true })}
              >
                {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>

          <Input
            label="WhatsApp Number"
            placeholder="03001234567"
            error={errors.whatsapp?.message}
            {...register("whatsapp")}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
