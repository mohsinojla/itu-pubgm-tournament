import fs from "fs";
import path from "path";
import HeroWallpaper from "./HeroWallpaper";

const PARTICLES = [
  { left: "8%", top: "20%", size: 3, delay: "0s", duration: "7s" },
  { left: "18%", top: "68%", size: 2, delay: "1.2s", duration: "6s" },
  { left: "27%", top: "35%", size: 4, delay: "0.4s", duration: "8s" },
  { left: "38%", top: "80%", size: 2, delay: "2.1s", duration: "6.5s" },
  { left: "52%", top: "15%", size: 3, delay: "0.8s", duration: "7.5s" },
  { left: "64%", top: "55%", size: 2, delay: "1.6s", duration: "6s" },
  { left: "73%", top: "25%", size: 4, delay: "0.2s", duration: "8.5s" },
  { left: "81%", top: "70%", size: 3, delay: "2.4s", duration: "7s" },
  { left: "90%", top: "40%", size: 2, delay: "1s", duration: "6.8s" },
  { left: "15%", top: "48%", size: 3, delay: "1.8s", duration: "7.2s" },
  { left: "60%", top: "85%", size: 2, delay: "0.6s", duration: "6.4s" },
  { left: "45%", top: "50%", size: 3, delay: "2.8s", duration: "7.8s" },
];

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp)$/i;

function listWallpapers(dir: string): string[] {
  const absoluteDir = path.join(process.cwd(), "public", "wallpapers", dir);
  let files: string[] = [];
  try {
    files = fs.readdirSync(absoluteDir).filter((f) => IMAGE_EXTENSIONS.test(f));
  } catch {
    return [];
  }
  files.sort((a, b) => {
    const numA = parseInt(a.match(/(\d+)(?=\.\w+$)/)?.[1] ?? "0", 10);
    const numB = parseInt(b.match(/(\d+)(?=\.\w+$)/)?.[1] ?? "0", 10);
    return numA - numB || a.localeCompare(b);
  });
  return files.map((f) => `/wallpapers/${dir}/${f}`);
}

export default function HeroBackground() {
  const desktopImages = listWallpapers("desktop");
  const mobileImages = listWallpapers("mobile");

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <HeroWallpaper desktopImages={desktopImages} mobileImages={mobileImages} />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-bg opacity-60" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,var(--bg)_95%)]" />

      {/* Zone circles (drop-zone style rings) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="zone-ring absolute -left-[150px] -top-[150px] w-[300px] h-[300px] rounded-full border border-[var(--primary)]/40" />
        <span
          className="zone-ring absolute -left-[150px] -top-[150px] w-[300px] h-[300px] rounded-full border border-[var(--primary)]/40"
          style={{ animationDelay: "1.5s" }}
        />
        <span
          className="zone-ring absolute -left-[150px] -top-[150px] w-[300px] h-[300px] rounded-full border border-[var(--primary)]/40"
          style={{ animationDelay: "3s" }}
        />
      </div>

      {/* Primary glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--primary)]/10 blur-3xl glow-pulse" />

      {/* Secondary accent glow, off-center */}
      <div className="absolute right-[10%] bottom-[10%] w-[400px] h-[400px] rounded-full bg-[var(--accent)]/10 blur-3xl glow-pulse" style={{ animationDelay: "1.5s" }} />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle absolute rounded-full bg-[var(--primary)]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}

      {/* Scanline texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(0deg,#fff_0px,#fff_1px,transparent_1px,transparent_3px)]" />
    </div>
  );
}
