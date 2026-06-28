import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Camera } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/itu_logo.png"
                alt="ITU"
                width={32}
                height={32}
                className="object-contain"
              />
              <Image
                src="/pubg_logo.png"
                alt="PUBGM"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <h3 className="font-heading font-bold text-lg gold-text">
              ITU × PUBGM Supremacy Cup
            </h3>
            <p className="mt-2 text-sm text-[var(--text-2)]">
              The premier PUBG Mobile tournament at Information Technology
              University Lahore.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4 text-[var(--text-1)]">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-[var(--text-2)]">
              {[
                ["/teams", "Teams"],
                ["/schedule", "Schedule"],
                ["/results", "Results"],
                ["/statistics", "Statistics"],
                ["/honour-board", "Honour Board"],
                ["/gallery", "Gallery"],
                ["/rules", "Rules"],
                ["/about", "About Us"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="hover:text-[var(--primary)] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Organiser */}
          <div>
            <h4 className="font-heading font-semibold mb-4 text-[var(--text-1)]">
              Organised By
            </h4>
            <p className="text-sm text-[var(--text-2)] mb-4">
              PUBGM Campus Ambassador
              <br />
              Information Technology University
              <br />
              Lahore, Pakistan
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/itupubgmcommunity"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="p-2 rounded-lg bg-[var(--card)] hover:text-[var(--primary)] transition-colors"
              >
                <Camera size={16} />
              </a>
              <a
                href="https://chat.whatsapp.com/GtPjK1tFxTW4E160fsDjIX"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join WhatsApp Group"
                className="p-2 rounded-lg bg-[var(--card)] hover:text-[var(--primary)] transition-colors"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-2)]">
          <p>© {year} ITU × PUBGM Supremacy Cup. All rights reserved.</p>
          <p>
            Built for ITU Lahore Esports Community
          </p>
        </div>
      </div>
    </footer>
  );
}
