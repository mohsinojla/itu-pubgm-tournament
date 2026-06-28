import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import Team from "@/lib/db/models/Team";
import Announcement from "@/lib/db/models/Announcement";
import AnnouncementFeed from "@/components/announcements/AnnouncementFeed";
import { auth } from "@/lib/auth/auth";
import { Users, Swords, Trophy, ArrowRight } from "lucide-react";

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

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden grid-bg">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-[var(--primary)]/5 blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Logos */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Image src="/itu_logo.png" alt="ITU" width={64} height={64} className="object-contain" />
            <span className="text-3xl font-heading text-[var(--text-2)]">×</span>
            <Image src="/pubg_logo.png" alt="PUBGM" width={64} height={64} className="object-contain" />
          </div>

          <h1 className="font-heading text-5xl sm:text-7xl font-black mb-4 gold-text">
            Supremacy Cup
          </h1>
          <p className="font-heading text-xl sm:text-2xl text-[var(--text-2)] mb-2">
            ITU × PUBG Mobile
          </p>
          <p className="text-sm sm:text-base text-[var(--text-2)] mb-10 max-w-xl mx-auto">
            The ultimate campus tournament. Form your squad, prove your skills, and rise to the top.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {!session?.user?.id ? (
              <>
                <Link
                  href="/register"
                  className="px-8 py-3.5 rounded-xl bg-[var(--primary)] text-black font-bold text-base hover:bg-[var(--primary-dim)] transition-colors glow-primary-sm"
                >
                  Register Now
                </Link>
                <Link
                  href="/teams"
                  className="px-8 py-3.5 rounded-xl border border-[var(--border)] text-[var(--text-1)] font-medium text-base hover:border-[var(--primary-dim)] transition-colors"
                >
                  View Teams
                </Link>
              </>
            ) : !session.user.teamId ? (
              <>
                <Link
                  href="/teams/create"
                  className="px-8 py-3.5 rounded-xl bg-[var(--primary)] text-black font-bold text-base hover:bg-[var(--primary-dim)] transition-colors glow-primary-sm"
                >
                  Create Team
                </Link>
                <Link
                  href="/teams"
                  className="px-8 py-3.5 rounded-xl border border-[var(--border)] text-[var(--text-1)] font-medium text-base hover:border-[var(--primary-dim)] transition-colors"
                >
                  Join a Team
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/teams/${session.user.teamId}`}
                  className="px-8 py-3.5 rounded-xl bg-[var(--primary)] text-black font-bold text-base hover:bg-[var(--primary-dim)] transition-colors glow-primary-sm"
                >
                  My Team
                </Link>
                <Link
                  href="/statistics"
                  className="px-8 py-3.5 rounded-xl border border-[var(--border)] text-[var(--text-1)] font-medium text-base hover:border-[var(--primary-dim)] transition-colors"
                >
                  Leaderboard
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--text-2)]">
          <div className="w-0.5 h-8 bg-gradient-to-b from-transparent to-[var(--primary)]/50 animate-pulse" />
          <span className="text-xs">Scroll to explore</span>
        </div>
      </section>

      {/* Stats banner */}
      <section className="bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <StatItem icon={<Users size={22} className="text-[var(--primary)]" />} value={playerCount} label="Registered Players" />
          <StatItem icon={<Swords size={22} className="text-[var(--primary)]" />} value={teamCount} label="Competing Teams" />
          <StatItem icon={<Trophy size={22} className="text-[var(--primary)]" />} value="TBD" label="Prize Pool" />
        </div>
      </section>

      {/* Announcements preview */}
      {latestAnnouncements.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold">Latest News</h2>
            <Link href="/announcements" className="text-sm text-[var(--primary)] flex items-center gap-1 hover:underline">
              All announcements <ArrowRight size={14} />
            </Link>
          </div>
          <AnnouncementFeed initialAnnouncements={JSON.parse(JSON.stringify(latestAnnouncements))} />
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-[var(--border)] bg-gradient-to-b from-[var(--bg)] to-[var(--surface)]">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h2 className="font-heading text-3xl font-bold mb-3 gold-text">Ready to compete?</h2>
          <p className="text-[var(--text-2)] mb-8">Register, form your team, and make history at ITU.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-[var(--primary)] text-black font-semibold hover:bg-[var(--primary-dim)] transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/rules"
              className="px-6 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary-dim)] transition-colors"
            >
              Read the Rules
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {icon}
      <span className="font-heading text-4xl font-black text-[var(--primary)]">{value}</span>
      <span className="text-sm text-[var(--text-2)]">{label}</span>
    </div>
  );
}
