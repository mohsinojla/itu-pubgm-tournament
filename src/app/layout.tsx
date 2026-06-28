import type { Metadata, Viewport } from "next";
import { Inter, Rajdhani } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const appUrl = "https://itu-pubgm-tournament.vercel.app";
  return {
    metadataBase: new URL(appUrl),
    title: {
      default: "ITU × PUBGM Supremacy Cup",
      template: "%s | ITU × PUBGM Supremacy Cup",
    },
    description:
      "The official tournament platform for the ITU × PUBGM Supremacy Cup at Information Technology University Lahore.",
    keywords: ["PUBGM", "ITU", "tournament", "esports", "Lahore", "PUBG Mobile"],
    authors: [{ name: "Mohsin Raza Ojla" }],
    openGraph: {
      title: "ITU × PUBGM Supremacy Cup",
      description:
        "Register, form your squad, and compete for glory in the ITU × PUBGM Supremacy Cup.",
      type: "website",
      locale: "en_PK",
      siteName: "ITU × PUBGM Supremacy Cup",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "ITU × PUBGM Supremacy Cup",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "ITU × PUBGM Supremacy Cup",
      description: "Register, form your squad, and compete for glory in the ITU × PUBGM Supremacy Cup.",
      images: ["/og-image.png"],
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "ITU PUBGM",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#f2a316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${rajdhani.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1a2e",
                color: "#ffffff",
                border: "1px solid #2a2a3e",
              },
              success: {
                iconTheme: { primary: "#f2a316", secondary: "#0a0a0f" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#0a0a0f" },
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
