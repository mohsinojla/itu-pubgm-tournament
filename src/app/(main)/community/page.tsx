import Image from "next/image";
import PageHero from "@/components/common/PageHero";
import { Star, Users } from "lucide-react";
import { connectDB } from "@/lib/db/mongoose";
import CommunityMember from "@/lib/db/models/CommunityMember";
import GallerySection from "@/lib/db/models/GallerySection";

export const dynamic = "force-dynamic";

interface MemberUser {
  _id: string;
  name?: string;
  photo?: string;
  email: string;
  degreeProgramme?: string;
  semester?: number;
}

interface PopulatedMember {
  _id: string;
  userId: MemberUser;
  eventId?: string | null;
  communityRole: string;
  bio?: string;
  order: number;
  isHighlighted: boolean;
}

interface Event {
  _id: string;
  name: string;
  description?: string;
  order: number;
}

async function getData() {
  await connectDB();
  const [events, members] = await Promise.all([
    GallerySection.find().sort({ order: 1, createdAt: 1 }).lean(),
    CommunityMember.find()
      .populate("userId", "name photo email degreeProgramme semester")
      .sort({ isHighlighted: -1, order: 1, createdAt: 1 })
      .lean(),
  ]);
  return {
    events: JSON.parse(JSON.stringify(events)) as Event[],
    members: JSON.parse(JSON.stringify(members)) as PopulatedMember[],
  };
}

export default async function CommunityPage() {
  const { events, members } = await getData();

  // Split members
  const ambassadors = members.filter((m) => m.isHighlighted && !m.eventId);
  const generalMembers = members.filter((m) => !m.isHighlighted && !m.eventId);

  const ambassador = ambassadors[0] ?? null;
  const otherHighlighted = ambassadors.slice(1);

  return (
    <>
      <PageHero
        title="Community"
        subtitle="The people behind the ITU × PUBGM Supremacy Cup"
      />
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">

        {/* Campus Ambassador hero */}
        {ambassador ? (
          <AmbassadorHero member={ambassador} />
        ) : (
          <FallbackAmbassador />
        )}

        {/* Other highlighted general members */}
        {otherHighlighted.length > 0 && (
          <section>
            <SectionHeading icon={<Star size={18} />}>Organizing Team</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherHighlighted.map((m) => <FeaturedCard key={m._id} member={m} />)}
            </div>
          </section>
        )}

        {/* General community members (no event) */}
        {generalMembers.length > 0 && (
          <section>
            <SectionHeading icon={<Users size={18} />}>Community Members</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {generalMembers.map((m) => <MemberCard key={m._id} member={m} />)}
            </div>
          </section>
        )}

        {/* Event sections */}
        {events.map((event) => {
          const eventAmbassadors = members.filter((m) => m.isHighlighted && m.eventId === event._id);
          const eventRegular = members.filter((m) => !m.isHighlighted && m.eventId === event._id);
          const allEventMembers = [...eventAmbassadors, ...eventRegular];
          if (allEventMembers.length === 0) return null;

          return (
            <section key={event._id}>
              <div className="mb-6 pb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-7 rounded-full bg-[var(--primary)]" />
                  <h2 className="font-heading text-2xl font-bold">{event.name}</h2>
                  <span className="text-xs text-[var(--text-2)] bg-[var(--surface)] border border-[var(--border)] px-2 py-0.5 rounded-full">
                    {allEventMembers.length} {allEventMembers.length === 1 ? "member" : "members"}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-[var(--text-2)] mt-2 ml-4">{event.description}</p>
                )}
              </div>

              {/* Featured members within the event */}
              {eventAmbassadors.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {eventAmbassadors.map((m) => <FeaturedCard key={m._id} member={m} />)}
                </div>
              )}

              {/* Regular members within the event */}
              {eventRegular.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {eventRegular.map((m) => <MemberCard key={m._id} member={m} />)}
                </div>
              )}
            </section>
          );
        })}

        {/* About */}
        <section className="game-card p-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <Users size={16} className="text-[var(--primary)]" />
            </div>
            <h2 className="font-heading text-xl font-bold">About the Tournament</h2>
          </div>
          <p className="text-[var(--text-2)] leading-relaxed">
            The <span className="text-[var(--primary)] font-semibold">ITU × PUBGM Supremacy Cup</span> is
            an official PUBG Mobile tournament organized by the PUBGM community at the{" "}
            <span className="text-[var(--text-1)]">Information Technology University (ITU), Lahore</span>.
          </p>
          <p className="text-[var(--text-2)] leading-relaxed">
            Whether you are a seasoned player or a newcomer, this tournament is your chance to showcase
            your skills and be part of ITU&apos;s growing esports culture.
          </p>
        </section>

        {/* Connect */}
        <section className="game-card p-8">
          <h2 className="font-heading text-xl font-bold mb-6">Connect With Us</h2>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <a href="https://www.instagram.com/itupubgmcommunity" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[var(--border)] hover:border-pink-500/50 hover:text-pink-400 transition-colors text-sm font-medium">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/instagram-icon.png" alt="" width={20} height={20} className="object-contain" />
              @itupubgmcommunity
            </a>
            <a href="https://chat.whatsapp.com/GtPjK1tFxTW4E160fsDjIX" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--success)]/50 hover:text-[var(--success)] transition-colors text-sm font-medium">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/whatsapp-icon.png" alt="" width={20} height={20} className="object-contain" />
              Join WhatsApp Group
            </a>
            <a href="https://www.linkedin.com/in/mohsin-raza-aujla-bsse23040" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[var(--border)] hover:border-[#0077b5]/50 hover:text-[#0077b5] transition-colors text-sm font-medium">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/LinkedIn_icon.png" alt="" width={20} height={20} className="object-contain" />
              Mohsin Raza Ojla
            </a>
          </div>
        </section>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-[var(--primary)]">{icon}</span>
      <h2 className="font-heading text-2xl font-bold">{children}</h2>
    </div>
  );
}

function AmbassadorHero({ member }: { member: PopulatedMember }) {
  const u = member.userId;
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/10 via-[var(--surface)] to-[var(--card)] p-8 sm:p-12">
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[var(--primary)]/5 blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-8">
        <div className="relative shrink-0">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[var(--primary)] ring-8 ring-[var(--primary)]/10 overflow-hidden bg-[var(--surface)] flex items-center justify-center relative">
            {u.photo ? (
              <Image src={u.photo} alt={u.name ?? "Ambassador"} fill className="object-cover" />
            ) : (
              <span className="font-heading text-5xl font-black text-[var(--primary)]">
                {(u.name ?? u.email)[0].toUpperCase()}
              </span>
            )}
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--primary)] text-black text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
            Campus Ambassador
          </span>
        </div>
        <div className="text-center sm:text-left flex-1">
          <p className="font-heading text-3xl sm:text-4xl font-black text-[var(--text-1)]">{u.name ?? "—"}</p>
          <p className="text-[var(--primary)] font-semibold text-lg mt-1 flex items-center gap-1.5 justify-center sm:justify-start">
            <Star size={16} fill="currentColor" /> {member.communityRole}
          </p>
          {u.degreeProgramme && (
            <p className="text-[var(--text-2)] text-sm mt-1">{u.degreeProgramme}{u.semester ? ` · Semester ${u.semester}` : ""}</p>
          )}
          {member.bio && (
            <p className="text-[var(--text-2)] mt-4 leading-relaxed max-w-xl">{member.bio}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FallbackAmbassador() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/10 via-[var(--surface)] to-[var(--card)] p-8 sm:p-12">
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[var(--primary)]/5 blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-8">
        <div className="relative shrink-0">
          <div className="w-32 h-32 rounded-full bg-[var(--primary)]/20 border-4 border-[var(--primary)] ring-8 ring-[var(--primary)]/10 flex items-center justify-center">
            <span className="font-heading text-5xl font-black text-[var(--primary)]">M</span>
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--primary)] text-black text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
            Campus Ambassador
          </span>
        </div>
        <div className="text-center sm:text-left">
          <p className="font-heading text-3xl font-black text-[var(--text-1)]">Mohsin Raza Ojla</p>
          <p className="text-[var(--primary)] font-semibold mt-1 flex items-center gap-1.5 justify-center sm:justify-start">
            <Star size={16} fill="currentColor" /> PUBGM Campus Ambassador · ITU Lahore
          </p>
          <p className="text-[var(--text-2)] mt-4 leading-relaxed max-w-xl">
            Passionate about building the PUBG Mobile community at ITU. Organizing this tournament
            to give every gamer at ITU a platform to compete, connect, and represent their skills.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeaturedCard({ member }: { member: PopulatedMember }) {
  const u = member.userId;
  return (
    <div className="game-card p-6 flex flex-col items-center text-center gap-4 border border-[var(--primary)]/20 hover:border-[var(--primary)]/40 transition-colors">
      <div className="relative w-24 h-24 rounded-full border-2 border-[var(--primary)] ring-4 ring-[var(--primary)]/10 overflow-hidden bg-[var(--surface)] flex items-center justify-center shrink-0">
        {u.photo ? (
          <Image src={u.photo} alt={u.name ?? "Member"} fill className="object-cover" />
        ) : (
          <span className="font-heading text-3xl font-bold text-[var(--primary)]">
            {(u.name ?? u.email)[0].toUpperCase()}
          </span>
        )}
      </div>
      <div>
        <p className="font-heading text-base font-bold">{u.name ?? "—"}</p>
        <p className="text-[var(--primary)] text-xs font-semibold mt-0.5 flex items-center gap-1 justify-center">
          <Star size={10} fill="currentColor" /> {member.communityRole}
        </p>
        {u.degreeProgramme && <p className="text-[var(--text-2)] text-xs mt-1">{u.degreeProgramme}</p>}
        {member.bio && <p className="text-[var(--text-2)] text-xs mt-2 leading-relaxed line-clamp-3">{member.bio}</p>}
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: PopulatedMember }) {
  const u = member.userId;
  return (
    <div className="game-card p-4 flex items-center gap-4 hover:border-[var(--primary)]/20 transition-colors group">
      <div className="relative w-14 h-14 rounded-full border-2 border-[var(--border)] group-hover:border-[var(--primary)]/40 overflow-hidden bg-[var(--surface)] flex items-center justify-center shrink-0 transition-colors">
        {u.photo ? (
          <Image src={u.photo} alt={u.name ?? "Member"} fill className="object-cover" />
        ) : (
          <span className="font-heading text-xl font-bold text-[var(--primary)]">
            {(u.name ?? u.email)[0].toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate">{u.name ?? "—"}</p>
        <p className="text-[var(--primary)] text-xs font-medium mt-0.5 truncate">{member.communityRole}</p>
        {u.degreeProgramme && <p className="text-[var(--text-2)] text-xs mt-0.5 truncate">{u.degreeProgramme}</p>}
        {member.bio && <p className="text-[var(--text-2)] text-xs mt-1 line-clamp-2">{member.bio}</p>}
      </div>
    </div>
  );
}
