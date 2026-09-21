"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { DEGREE_PROGRAMMES, maxSemesterForDegree } from "@/lib/constants/degrees";

export interface EditablePlayer {
  _id: string;
  name?: string;
  email: string;
  rollNumber?: string;
  pubgId?: string;
  pubgName?: string;
  gender?: string;
  semester?: number;
  degreeProgramme?: string;
  whatsapp?: string;
  teamId?: string;
}

export interface TeamOption {
  _id: string;
  name: string;
  memberCount: number;
}

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors";

export default function AdminPlayerEditModal({
  player,
  teams,
  onClose,
}: {
  player: EditablePlayer;
  teams: TeamOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: player.name ?? "",
    rollNumber: player.rollNumber ?? "",
    pubgId: player.pubgId ?? "",
    pubgName: player.pubgName ?? "",
    gender: player.gender ?? "male",
    degreeProgramme: player.degreeProgramme ?? "",
    semester: player.semester ?? 1,
    whatsapp: player.whatsapp ?? "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [teamId, setTeamId] = useState(player.teamId ?? "");
  const [teamRole, setTeamRole] = useState<"core" | "substitute">("core");
  const [savingTeam, setSavingTeam] = useState(false);

  const programmes: string[] = [...DEGREE_PROGRAMMES];
  if (form.degreeProgramme && !programmes.includes(form.degreeProgramme)) {
    programmes.unshift(form.degreeProgramme);
  }
  const maxSem = form.degreeProgramme ? maxSemesterForDegree(form.degreeProgramme) : 8;

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/admin/users/${player._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, semester: Number(form.semester) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile saved");
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to save profile");
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveTeam() {
    const current = player.teamId ?? "";
    if (teamId === current && !teamId) return;
    setSavingTeam(true);
    try {
      const res = await fetch(`/api/admin/users/${player._id}/team`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: teamId || null, role: teamRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(teamId ? "Team updated" : "Removed from team");
        router.refresh();
        onClose();
      } else {
        toast.error(data.error ?? "Failed to update team");
      }
    } finally {
      setSavingTeam(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg game-card p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-heading text-xl font-bold">Edit Player</h2>
          <button onClick={onClose} className="text-[var(--text-2)] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-[var(--text-2)] mb-5">{player.email}</p>

        <div className="space-y-3">
          <Field label="Full name">
            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Roll number">
            <input className={inputClass} value={form.rollNumber} onChange={(e) => set("rollNumber", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="PUBG ID">
              <input className={inputClass} value={form.pubgId} onChange={(e) => set("pubgId", e.target.value)} />
            </Field>
            <Field label="PUBG in-game name">
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
                {programmes.map((d) => (
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
          <Button className="w-full" loading={savingProfile} onClick={saveProfile}>
            Save profile
          </Button>
        </div>

        <div className="mt-6 pt-5 border-t border-[var(--border)] space-y-3">
          <h3 className="font-heading font-bold">Team</h3>
          <p className="text-xs text-[var(--text-2)]">
            Adds the player straight to a team (no join request). If they&apos;re on another team they&apos;re moved.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <select className={inputClass} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                <option value="">No team</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id} disabled={t.memberCount >= 5 && t._id !== player.teamId}>
                    {t.name} ({t.memberCount}/5)
                  </option>
                ))}
              </select>
            </div>
            <select
              className={inputClass}
              value={teamRole}
              onChange={(e) => setTeamRole(e.target.value as "core" | "substitute")}
              disabled={!teamId}
            >
              <option value="core">Core</option>
              <option value="substitute">Sub</option>
            </select>
          </div>
          <Button variant="outline" className="w-full" loading={savingTeam} onClick={saveTeam}>
            Apply team change
          </Button>
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
