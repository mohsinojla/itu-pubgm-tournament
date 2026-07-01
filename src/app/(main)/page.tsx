import Link from "next/link";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import Team from "@/lib/db/models/Team";
import Announcement from "@/lib/db/models/Announcement";
import AnnouncementFeed from "@/components/announcements/AnnouncementFeed";
import { auth } from "@/lib/auth/auth";
import { Users, Swords, Trophy, ArrowRight, Target, Crosshair, MapPin } from "lucide-react";
import HeroBackground from "@/components/home/HeroBackground";
import HeroReveal from "@/components/home/HeroReveal";
import StatCounter from "@/components/home/StatCounter";
import ScrollReveal from "@/components/home/ScrollReveal";

export const dynamic = "force-dynamic";

async function getHomeData() {
  await connectDB();
  const [playerCount, teamCount, latestAnnouncements] = await Promise.all([
    User.countDocuments({ profileCompleted: true }),
    Team.countDocuments(),
    Announcement.find()
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(3)
      .populate("postedBy", "name photo")
      .lean(),
  ]);
  return { playerCount, teamCount, latestAnnouncements };
}

export default async function HomePage() {
  const [session, { playerCount, teamCount, latestAnnouncements }] = await Promise.all([
    auth(),
    getHomeData(),
  ]);

  const sessionSlice = session?.user?.id
    ? {
        id: session.user.id,
        profileCompleted: session.user.profileCompleted,
        teamId: session.user.teamId,
      }
    : null;

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <HeroBackground />
        <HeroReveal session={sessionSlice} />

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--text-2)] z-10">
          <div className="w-0.5 h-8 bg-gradient-to-b from-transparent to-[var(--primary)]/50 animate-pulse" />
          <span className="text-xs">Scroll to explore</span>
        </div>
      </section>

      {/* Stats banner */}
      <section className="relative bg-[var(--surface)] border-y border-[var(--border)] overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <ScrollReveal className="relative max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <StatItem icon={<Users size={22} className="text-[var(--primary)]" />} value={playerCount} label="Registered Players" />
          <StatItem icon={<Swords size={22} className="text-[var(--primary)]" />} value={teamCount} label="Competing Teams" />
          <StatItem icon={<Trophy size={22} className="text-[var(--primary)]" />} value="TBD" label="Prize Pool" />
        </ScrollReveal>
      </section>

      {/* Features strip */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <ScrollReveal className="text-center mb-10">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold gold-text">How the Cup Works</h2>
          <p className="text-[var(--text-2)] text-sm mt-2">Three drops. One squad standing.</p>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <ScrollReveal delay={0}>
            <FeatureCard
              icon={<Users size={24} className="text-[var(--primary)]" />}
              title="Squad Up"
              text="Register and form a 4-player squad with your fellow ITU students."
            />
          </ScrollReveal>
          <ScrollReveal delay={0.12}>
            <FeatureCard
              icon={<Crosshair size={24} className="text-[var(--primary)]" />}
              title="Compete"
              text="Battle through scheduled matches across the bracket for tournament glory."
            />
          </ScrollReveal>
          <ScrollReveal delay={0.24}>
            <FeatureCard
              icon={<MapPin size={24} className="text-[var(--primary)]" />}
              title="Climb the Ranks"
              text="Track your squad's stats and rise up the live leaderboard."
            />
          </ScrollReveal>
        </div>
      </section>

      {/* Announcements preview */}
      {latestAnnouncements.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-16">
          <ScrollReveal className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold">Latest News</h2>
            <Link href="/announcements" className="text-sm text-[var(--primary)] flex items-center gap-1 hover:underline">
              All announcements <ArrowRight size={14} />
            </Link>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <AnnouncementFeed initialAnnouncements={JSON.parse(JSON.stringify(latestAnnouncements))} />
          </ScrollReveal>
        </section>
      )}

      {/* CTA */}
      <section className="relative border-t border-[var(--border)] bg-gradient-to-b from-[var(--bg)] to-[var(--surface)] overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--primary)]/5 blur-3xl glow-pulse pointer-events-none" />
        <ScrollReveal className="relative max-w-2xl mx-auto px-4 py-20 text-center">
          <Target size={32} className="mx-auto mb-4 text-[var(--primary)]" />
          <h2 className="font-heading text-3xl font-bold mb-3 gold-text">Ready to compete?</h2>
          <p className="text-[var(--text-2)] mb-8">Register, form your team, and make history at ITU.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {!session?.user?.id ? (
              <>
                <Link href="/register" className="px-6 py-3 rounded-xl bg-[var(--primary)] text-black font-semibold hover:bg-[var(--primary-dim)] hover:scale-105 active:scale-95 transition-all">Get Started</Link>
                <Link href="/login" className="px-6 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary-dim)] hover:scale-105 active:scale-95 transition-all">Login</Link>
              </>
            ) : !session.user.profileCompleted ? (
              <Link href="/profile" className="px-6 py-3 rounded-xl bg-[var(--primary)] text-black font-semibold hover:bg-[var(--primary-dim)] hover:scale-105 active:scale-95 transition-all">Complete Your Profile</Link>
            ) : !session.user.teamId ? (
              <>
                <Link href="/teams/create" className="px-6 py-3 rounded-xl bg-[var(--primary)] text-black font-semibold hover:bg-[var(--primary-dim)] hover:scale-105 active:scale-95 transition-all">Create a Team</Link>
                <Link href="/teams" className="px-6 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary-dim)] hover:scale-105 active:scale-95 transition-all">Browse Teams</Link>
              </>
            ) : (
              <>
                <Link href={`/teams/${session.user.teamId}`} className="px-6 py-3 rounded-xl bg-[var(--primary)] text-black font-semibold hover:bg-[var(--primary-dim)] hover:scale-105 active:scale-95 transition-all">My Team</Link>
                <Link href="/rules" className="px-6 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary-dim)] hover:scale-105 active:scale-95 transition-all">Read the Rules</Link>
              </>
            )}
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {icon}
      <span className="font-heading text-4xl font-black text-[var(--primary)]">
        {typeof value === "number" ? <StatCounter value={value} /> : value}
      </span>
      <span className="text-sm text-[var(--text-2)]">{label}</span>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="game-card p-6 text-center hover:-translate-y-1 hover:border-[var(--primary-dim)] transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-heading text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-2)]">{text}</p>
    </div>
  );
}
