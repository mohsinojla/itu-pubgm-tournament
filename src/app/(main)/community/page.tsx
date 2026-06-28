import PageHero from "@/components/common/PageHero";
import { Users, Instagram, MessageCircle } from "lucide-react";

export default function CommunityPage() {
  return (
    <>
      <PageHero
        title="Community"
        subtitle="Meet the team behind the ITU × PUBGM Supremacy Cup"
      />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
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

        {/* Organizer */}
        <div className="game-card p-8">
          <h2 className="font-heading text-2xl font-bold mb-6">Organizing Team</h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[var(--primary)]/20 border-2 border-[var(--primary)] flex items-center justify-center shrink-0">
              <span className="font-heading text-3xl font-bold text-[var(--primary)]">M</span>
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

        {/* Connect */}
        <div className="game-card p-8">
          <h2 className="font-heading text-2xl font-bold mb-6">Connect With Us</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="https://www.instagram.com/itupubgmcommunity"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)] transition-colors text-sm font-medium"
            >
              <Instagram size={18} />
              @itupubgmcommunity
            </a>
            <a
              href="https://chat.whatsapp.com/GtPjK1tFxTW4E160fsDjIX"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--success)]/50 hover:text-[var(--success)] transition-colors text-sm font-medium"
            >
              <MessageCircle size={18} />
              Join WhatsApp Group
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
