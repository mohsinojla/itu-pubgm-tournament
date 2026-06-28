import Image from "next/image";
import PageHero from "@/components/common/PageHero";
import { Users, Star } from "lucide-react";
import { connectDB } from "@/lib/db/mongoose";
import CommunityMember from "@/lib/db/models/CommunityMember";

export const dynamic = "force-dynamic";

interface PopulatedUser {
  _id: string;
  name?: string;
  photo?: string;
  email: string;
  degreeProgramme?: string;
  semester?: number;
}

interface PopulatedMember {
  _id: string;
  userId: PopulatedUser;
  communityRole: string;
  bio?: string;
  order: number;
  isHighlighted: boolean;
}

async function getCommunityMembers(): Promise<PopulatedMember[]> {
  await connectDB();
  const members = await CommunityMember.find()
    .populate("userId", "name photo email degreeProgramme semester")
    .sort({ isHighlighted: -1, order: 1, createdAt: 1 })
    .lean();
  return JSON.parse(JSON.stringify(members));
}

export default async function CommunityPage() {
  const members = await getCommunityMembers();
  const highlighted = members.filter((m) => m.isHighlighted);
  const regular = members.filter((m) => !m.isHighlighted);

  return (
    <>
      <PageHero
        title="Community"
        subtitle="Meet the team behind the ITU × PUBGM Supremacy Cup"
      />
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">

        {/* About section */}
        <div className="game-card p-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-[var(--primary)]" size={28} />
            <h2 className="font-heading text-2xl font-bold">About the Tournament</h2>
          </div>
          <p className="text-[var(--text-2)] leading-relaxed">
            The <span className="text-[var(--primary)] font-semibold">ITU × PUBGM Supremacy Cup</span> is
            an official PUBG Mobile tournament organized by the PUBGM community at the{" "}
            <span className="text-[var(--text-1)]">Information Technology University (ITU), Lahore</span>.
            This event brings together students from all departments to compete, connect, and represent
            their passion for gaming.
          </p>
          <p className="text-[var(--text-2)] leading-relaxed">
            Whether you are a seasoned player or a newcomer, this tournament is your chance to showcase
            your skills on an official stage and be part of ITU's growing esports culture.
          </p>
        </div>

        {/* Highlighted (featured) members */}
        {highlighted.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Star className="text-[var(--primary)]" size={20} />
              <h2 className="font-heading text-2xl font-bold">Organizing Team</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {highlighted.map((m) => (
                <HighlightedCard key={m._id} member={m} />
              ))}
            </div>
          </div>
        )}

        {/* Regular members */}
        {regular.length > 0 && (
          <div>
            <h2 className="font-heading text-2xl font-bold mb-6">Core Members</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regular.map((m) => (
                <MemberCard key={m._id} member={m} />
              ))}
            </div>
          </div>
        )}

        {/* Fallback when no members in DB */}
        {members.length === 0 && (
          <div className="game-card p-8">
            <h2 className="font-heading text-2xl font-bold mb-6">Organizing Team</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-[var(--primary)]/20 border-2 border-[var(--primary)] flex items-center justify-center shrink-0 ring-4 ring-[var(--primary)]/10">
                <span className="font-heading text-4xl font-bold text-[var(--primary)]">M</span>
              </div>
              <div>
                <p className="font-heading text-xl font-bold">Mohsin Raza Ojla</p>
                <p className="text-[var(--primary)] text-sm font-semibold mt-0.5">
                  Campus Ambassador — PUBGM @ ITU Lahore
                </p>
                <p className="text-[var(--text-2)] text-sm mt-2 leading-relaxed">
                  Passionate about building the PUBG Mobile community at ITU. Organizing this
                  tournament to give every gamer at ITU a platform to compete and connect.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connect */}
        <div className="game-card p-8">
          <h2 className="font-heading text-2xl font-bold mb-6">Connect With Us</h2>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <a
              href="https://www.instagram.com/itupubgmcommunity"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)] transition-colors text-sm font-medium"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/instagram-icon.png" alt="Instagram" width={22} height={22} className="object-contain" />
              @itupubgmcommunity
            </a>
            <a
              href="https://chat.whatsapp.com/GtPjK1tFxTW4E160fsDjIX"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--success)]/50 hover:text-[var(--success)] transition-colors text-sm font-medium"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/whatsapp-icon.png" alt="WhatsApp" width={22} height={22} className="object-contain" />
              Join WhatsApp Group
            </a>
            <a
              href="https://www.linkedin.com/in/mohsin-raza-aujla-bsse23040"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[var(--border)] hover:border-[#0077b5]/50 hover:text-[#0077b5] transition-colors text-sm font-medium"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/LinkedIn_icon.png" alt="LinkedIn" width={22} height={22} className="object-contain" />
              Mohsin Raza Ojla
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

function HighlightedCard({ member }: { member: PopulatedMember }) {
  const u = member.userId;
  return (
    <div className="game-card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 border border-[var(--primary)]/20">
      <div className="w-20 h-20 rounded-full shrink-0 border-2 border-[var(--primary)] ring-4 ring-[var(--primary)]/10 overflow-hidden bg-[var(--surface)] flex items-center justify-center relative">
        {u.photo ? (
          <Image src={u.photo} alt={u.name ?? "Member"} fill className="object-cover" />
        ) : (
          <span className="font-heading text-3xl font-bold text-[var(--primary)]">
            {(u.name ?? u.email)[0].toUpperCase()}
          </span>
        )}
      </div>
      <div className="text-center sm:text-left">
        <p className="font-heading text-lg font-bold text-[var(--text-1)]">{u.name ?? "—"}</p>
        <p className="text-[var(--primary)] text-sm font-semibold mt-0.5 flex items-center gap-1 justify-center sm:justify-start">
          <Star size={12} /> {member.communityRole}
        </p>
        {u.degreeProgramme && (
          <p className="text-xs text-[var(--text-2)] mt-1">{u.degreeProgramme}</p>
        )}
        {member.bio && (
          <p className="text-[var(--text-2)] text-sm mt-2 leading-relaxed">{member.bio}</p>
        )}
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: PopulatedMember }) {
  const u = member.userId;
  return (
    <div className="game-card p-5 flex items-center gap-4">
      <div className="w-14 h-14 rounded-full shrink-0 border border-[var(--border)] overflow-hidden bg-[var(--surface)] flex items-center justify-center relative">
        {u.photo ? (
          <Image src={u.photo} alt={u.name ?? "Member"} fill className="object-cover" />
        ) : (
          <span className="font-heading text-xl font-bold text-[var(--primary)]">
            {(u.name ?? u.email)[0].toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-[var(--text-1)] truncate">{u.name ?? "—"}</p>
        <p className="text-[var(--primary)] text-xs font-medium mt-0.5 truncate">{member.communityRole}</p>
        {u.degreeProgramme && (
          <p className="text-[var(--text-2)] text-xs mt-0.5 truncate">{u.degreeProgramme}</p>
        )}
        {member.bio && (
          <p className="text-[var(--text-2)] text-xs mt-1 line-clamp-2">{member.bio}</p>
        )}
      </div>
    </div>
  );
}
