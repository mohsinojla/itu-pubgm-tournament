"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { User, Camera, Upload } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { completeProfileSchema, type CompleteProfileInput } from "@/lib/validators/user.schema";
import { DEGREE_PROGRAMMES } from "@/lib/constants/degrees";

const SEMESTERS = Array.from({ length: 12 }, (_, i) => i + 1);

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Prefer not to say" },
];

export default function CompleteProfileForm() {
  const { update } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteProfileInput>({ resolver: zodResolver(completeProfileSchema) });

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return null;

    // Get signed upload params from server
    const sigRes = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "avatars", resourceType: "image" }),
    });
    const sigData = await sigRes.json();
    if (!sigData.signature) throw new Error("Failed to get upload signature");

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
    const uploadData = await uploadRes.json();
    if (!uploadData.secure_url) throw new Error("Upload failed");
    return uploadData.secure_url;
  }

  async function onSubmit(values: CompleteProfileInput) {
    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          ...(photoUrl && { photo: photoUrl }),
          profileCompleted: true,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Failed to save profile");
        return;
      }

      await update({ profileCompleted: true });
      toast.success("Profile complete! Welcome to the tournament.");
      router.push("/teams");
      router.refresh();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Photo Upload */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-24 h-24 rounded-full border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] transition-colors bg-[var(--surface)] overflow-hidden group"
        >
          {photoPreview ? (
            <Image src={photoPreview} alt="Preview" fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full gap-1 text-[var(--text-2)] group-hover:text-[var(--primary)] transition-colors">
              <User size={28} />
              <Camera size={14} />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload size={20} className="text-white" />
          </div>
        </button>
        <p className="text-xs text-[var(--text-2)]">Profile photo (optional, max 5MB)</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />
      </div>

      {/* Name */}
      <Input
        label="Full Name"
        placeholder="Muhammad Ali"
        error={errors.name?.message}
        required
        {...register("name")}
      />

      {/* Roll Number */}
      <Input
        label="Roll Number"
        placeholder="2021-CS-100"
        error={errors.rollNumber?.message}
        required
        {...register("rollNumber")}
      />

      {/* PUBG ID */}
      <Input
        label="PUBG Mobile ID"
        placeholder="Your numeric PUBG ID"
        error={errors.pubgId?.message}
        hint="Enter your PUBG Mobile UID (found in your profile)"
        required
        {...register("pubgId")}
      />

      {/* PUBG Name */}
      <Input
        label="PUBG In-Game Name"
        placeholder="YourGamertag"
        error={errors.pubgName?.message}
        required
        {...register("pubgName")}
      />

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
          Gender <span className="text-[var(--danger)]">*</span>
        </label>
        <div className="flex gap-3">
          {GENDER_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                value={opt.value}
                className="accent-[var(--primary)]"
                {...register("gender")}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
        {errors.gender && (
          <p className="mt-1 text-xs text-[var(--danger)]">{errors.gender.message}</p>
        )}
      </div>

      {/* Semester + Degree in a grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Semester */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
            Semester <span className="text-[var(--danger)]">*</span>
          </label>
          <select
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-1)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
            {...register("semester", { valueAsNumber: true })}
          >
            <option value="">Select</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.semester && (
            <p className="mt-1 text-xs text-[var(--danger)]">{errors.semester.message}</p>
          )}
        </div>

        {/* Degree */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
            Degree Programme <span className="text-[var(--danger)]">*</span>
          </label>
          <select
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-1)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
            {...register("degreeProgramme")}
          >
            <option value="">Select</option>
            {DEGREE_PROGRAMMES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.degreeProgramme && (
            <p className="mt-1 text-xs text-[var(--danger)]">{errors.degreeProgramme.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" loading={submitting}>
        Complete Registration
      </Button>
    </form>
  );
}
