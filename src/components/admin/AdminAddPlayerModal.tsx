"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { DEGREE_PROGRAMMES, maxSemesterForDegree } from "@/lib/constants/degrees";

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors";

const EMPTY = {
  email: "",
  name: "",
  rollNumber: "",
  pubgId: "",
  pubgName: "",
  gender: "male",
  degreeProgramme: "",
  semester: 1,
  whatsapp: "",
};

export default function AdminAddPlayerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const maxSem = form.degreeProgramme ? maxSemesterForDegree(form.degreeProgramme) : 8;

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, semester: Number(form.semester) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${form.name} added — they can sign in with Google using ${form.email}`);
        router.refresh();
        onClose();
      } else {
        toast.error(data.error ?? "Failed to add player");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg game-card p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-heading text-xl font-bold">Add Player</h2>
          <button onClick={onClose} className="text-[var(--text-2)] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-[var(--text-2)] mb-5">
          For a player who registered on paper. No password is set — they sign in later with Google using the email below, which links straight to this profile.
        </p>

        <div className="space-y-3">
          <Field label="Email (must match their Google account)">
            <input
              type="email"
              className={inputClass}
              placeholder="player@gmail.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Full name">
            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Roll number">
            <input className={inputClass} value={form.rollNumber} onChange={(e) => set("rollNumber", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="PUBG ID (optional)">
              <input className={inputClass} value={form.pubgId} onChange={(e) => set("pubgId", e.target.value)} />
            </Field>
            <Field label="PUBG in-game name (optional)">
              <input className={inputClass} value={form.pubgName} onChange={(e) => set("pubgName", e.target.value)} />
            </Field>
          </div>
          <Field label="Gender">
            <select className={inputClass} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / prefer not to say</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Degree programme">
              <select
                className={inputClass}
                value={form.degreeProgramme}
                onChange={(e) => {
                  set("degreeProgramme", e.target.value);
                  if (form.semester > maxSemesterForDegree(e.target.value)) set("semester", 1);
                }}
              >
                <option value="">Select</option>
                {DEGREE_PROGRAMMES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Semester">
              <select
                className={inputClass}
                value={form.semester}
                onChange={(e) => set("semester", Number(e.target.value))}
              >
                {Array.from({ length: maxSem }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="WhatsApp">
            <input
              className={inputClass}
              placeholder="03001234567"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
            />
          </Field>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={save}>Add player</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-2)] mb-1">{label}</label>
      {children}
    </div>
  );
}
