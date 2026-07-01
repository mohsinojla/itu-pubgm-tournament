"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const CYCLE_MS = 30000;

function WallpaperLayer({ images, className }: { images: string[]; className: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <AnimatePresence>
        <motion.div
          key={images[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={images[index]}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function HeroWallpaper({
  desktopImages,
  mobileImages,
}: {
  desktopImages: string[];
  mobileImages: string[];
}) {
  return (
    <div className="absolute inset-0">
      <WallpaperLayer images={desktopImages} className="hidden sm:block" />
      <WallpaperLayer images={mobileImages.length ? mobileImages : desktopImages} className="sm:hidden" />

      {/* Darken for text contrast + stunning depth */}
      <div className="absolute inset-0 bg-[var(--bg)]/70" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/50 via-transparent to-[var(--bg)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
    </div>
  );
}
