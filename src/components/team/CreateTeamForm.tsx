"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Users, Upload } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { createTeamSchema, type CreateTeamInput } from "@/lib/validators/team.schema";
import { compressImage } from "@/lib/utils/compress";

export default function CreateTeamForm() {
  const router = useRouter();
  const { update } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
  });

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Logo must be under 5MB"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return null;
    const compressed = await compressImage(logoFile, 200);
    const sigRes = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "team-logos", resourceType: "image" }),
    });
    const sigData = await sigRes.json();
    if (!sigData.signature) throw new Error("Upload signature failed");
    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("api_key", sigData.apiKey);
    formData.append("timestamp", sigData.timestamp.toString());
    formData.append("signature", sigData.signature);
    formData.append("folder", sigData.folder);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    return data.secure_url ?? null;
  }

  async function onSubmit(values: CreateTeamInput) {
    setSubmitting(true);
    try {
      let logoUrl: string | undefined;
      if (logoFile) logoUrl = await uploadLogo() ?? undefined;

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, ...(logoUrl && { logo: logoUrl }) }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error ?? "Failed to create team"); return; }

      toast.success(`Team "${values.name}" created!`);
      await update();
      router.push(`/teams/${data.team._id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Logo Upload */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-24 h-24 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] transition-colors bg-[var(--surface)] overflow-hidden group"
        >
          {logoPreview ? (
            <Image src={logoPreview} alt="Logo preview" fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full gap-1 text-[var(--text-2)] group-hover:text-[var(--primary)] transition-colors">
              <Users size={28} />
              <Upload size={14} />
            </div>
          )}
        </button>
        <p className="text-xs text-[var(--text-2)]">Team logo (optional)</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
      </div>

      <Input
        label="Team Name"
        placeholder="e.g. Shadow Wolves"
        error={errors.name?.message}
        hint="Exactly 2 words, less than 25 characters (e.g. Shadow Wolves)"
        required
        {...register("name")}
      />

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--text-2)]">
        <p className="font-medium text-[var(--text-1)] mb-1">Team structure</p>
        <ul className="space-y-1 text-xs list-disc list-inside">
          <li>You become the team leader as the creator</li>
          <li>A unique 5-digit Team ID is auto-assigned</li>
          <li>Up to 4 core players + 1 substitute (5 total)</li>
          <li>Other players can request to join</li>
          <li>Leadership can be transferred to any member</li>
        </ul>
      </div>

      <Button type="submit" className="w-full" size="lg" loading={submitting}>
        Create Team
      </Button>
    </form>
  );
}
