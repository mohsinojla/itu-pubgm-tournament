"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

type SessionSlice = {
  id?: string | null;
  profileCompleted?: boolean;
  teamId?: string | null;
} | null;

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const primaryBtn =
  "px-8 py-3.5 rounded-xl bg-[var(--primary)] text-black font-bold text-base hover:bg-[var(--primary-dim)] hover:scale-105 active:scale-95 transition-all glow-primary-sm";
const secondaryBtn =
  "px-8 py-3.5 rounded-xl border border-[var(--border)] text-[var(--text-1)] font-medium text-base hover:border-[var(--primary-dim)] hover:scale-105 active:scale-95 transition-all";

export default function HeroReveal({ session }: { session: SessionSlice }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative z-10 text-center px-4 max-w-4xl mx-auto"
    >
      <motion.div variants={item} className="flex items-center justify-center gap-4 mb-8">
        <Image src="/itu_logo.png" alt="ITU" width={64} height={64} className="object-contain" />
        <span className="text-3xl font-heading text-[var(--text-2)]">×</span>
        <Image src="/pubg_logo.png" alt="PUBGM" width={64} height={64} className="object-contain" />
      </motion.div>

      <motion.h1 variants={item} className="font-heading text-5xl sm:text-7xl font-black mb-4 gold-text-animated">
        Supremacy Cup
      </motion.h1>
      <motion.p variants={item} className="font-heading text-xl sm:text-2xl text-[var(--text-2)] mb-2">
        ITU × PUBG Mobile
      </motion.p>
      <motion.p variants={item} className="text-sm sm:text-base text-[var(--text-2)] mb-10 max-w-xl mx-auto">
        The ultimate campus tournament. Form your squad, prove your skills, and rise to the top.
      </motion.p>

      <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-4">
        {!session?.id ? (
          <>
            <Link href="/register" className={primaryBtn}>
              Register Now
            </Link>
            <Link href="/login" className={secondaryBtn}>
              Login
            </Link>
          </>
        ) : !session.profileCompleted ? (
          <>
            <Link href="/profile" className={primaryBtn}>
              Complete Profile
            </Link>
            <Link href="/teams" className={secondaryBtn}>
              View Teams
            </Link>
          </>
        ) : !session.teamId ? (
          <>
            <Link href="/teams/create" className={primaryBtn}>
              Create Team
            </Link>
            <Link href="/teams" className={secondaryBtn}>
              Join a Team
            </Link>
          </>
        ) : (
          <>
            <Link href={`/teams/${session.teamId}`} className={primaryBtn}>
              My Team
            </Link>
            <Link href="/statistics" className={secondaryBtn}>
              Leaderboard
            </Link>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
