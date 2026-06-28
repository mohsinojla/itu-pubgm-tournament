"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ExternalLink, Link2, User, Plus, Trash2, Star } from "lucide-react";
import Button from "@/components/ui/Button";

interface TeamMember {
  _id: string;
  name: string;
  role: string;
  photo?: string;
  bio?: string;
  socials?: { instagram?: string; linkedin?: string };
  isHighlighted?: boolean;
}

interface Props {
  members: TeamMember[];
  isAdmin: boolean;
}

export default function AboutGrid({ members, isAdmin }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", role: "", bio: "", instagram: "", linkedin: "" });
  const [saving, setSaving] = useState(false);

  const highlighted = members.filter((m) => m.isHighlighted);
  const others = members.filter((m) => !m.isHighlighted);

  async function addMember() {
    if (!formData.name || !formData.role) { toast.error("Name and role are required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          bio: formData.bio,
          socials: { instagram: formData.instagram, linkedin: formData.linkedin },
        }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Member added!"); setShowForm(false); router.refresh(); }
      else toast.error(data.error ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(id: string) {
    if (!confirm("Remove this team member?")) return;
    try {
      const res = await fetch(`/api/about/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast.success("Removed"); router.refresh(); }
      else toast.error(data.error ?? "Failed");
    } catch {
      toast.error("Something went wrong");
    }
  }

  if (members.length === 0 && !isAdmin) {
    return (
      <div className="text-center py-20 text-[var(--text-2)]">
        <User size={40} className="mx-auto mb-4 opacity-30" />
        <p>Team members will be introduced soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Admin: Add member */}
      {isAdmin && (
        <div>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} variant="outline">
              <Plus size={14} className="mr-1" /> Add Team Member
            </Button>
          ) : (
            <div className="game-card p-5 space-y-3 max-w-md">
              <h3 className="font-heading font-bold">Add Member</h3>
              {[
                { key: "name", label: "Full Name", required: true },
                { key: "role", label: "Role/Title", required: true },
                { key: "bio", label: "Short Bio" },
                { key: "instagram", label: "Instagram username" },
                { key: "linkedin", label: "LinkedIn URL" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs text-[var(--text-2)] mb-1">{field.label}{field.required ? " *" : ""}</label>
                  <input
                    type="text"
                    value={(formData as Record<string, string>)[field.key]}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" loading={saving} onClick={addMember}>Add</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Highlighted members */}
      {highlighted.length > 0 && (
        <div>
          <h2 className="font-heading text-xl font-bold mb-6 text-center">Core Organizers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlighted.map((m) => <MemberCard key={m._id} member={m} isAdmin={isAdmin} onDelete={deleteMember} />)}
          </div>
        </div>
      )}

      {/* Others */}
      {others.length > 0 && (
        <div>
          {highlighted.length > 0 && <h2 className="font-heading text-xl font-bold mb-6 text-center">Team Members</h2>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {others.map((m) => <MemberCard key={m._id} member={m} isAdmin={isAdmin} onDelete={deleteMember} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function MemberCard({
  member,
  isAdmin,
  onDelete,
}: {
  member: TeamMember;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="game-card p-5 flex flex-col items-center text-center gap-3 group relative">
      {member.isHighlighted && (
        <Star size={14} className="absolute top-3 right-3 text-[var(--primary)] fill-[var(--primary)]" />
      )}

      {/* Photo */}
      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--surface)]">
        {member.photo ? (
          <Image src={member.photo} alt={member.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--primary)]/10">
            <span className="text-2xl font-bold text-[var(--primary)]">{member.name[0]}</span>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-heading font-bold">{member.name}</h3>
        <p className="text-xs text-[var(--primary)]">{member.role}</p>
        {member.bio && <p className="text-xs text-[var(--text-2)] mt-1.5 line-clamp-3">{member.bio}</p>}
      </div>

      {/* Socials */}
      {(member.socials?.instagram || member.socials?.linkedin) && (
        <div className="flex items-center gap-2">
          {member.socials.instagram && (
            <a
              href={`https://instagram.com/${member.socials.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--primary-dim)] text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          )}
          {member.socials.linkedin && (
            <a
              href={member.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--primary-dim)] text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
            >
              <Link2 size={14} />
            </a>
          )}
        </div>
      )}

      {/* Admin delete */}
      {isAdmin && (
        <button
          onClick={() => onDelete(member._id)}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
