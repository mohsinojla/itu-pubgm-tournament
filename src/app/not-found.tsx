import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 grid-bg">
      <h1 className="font-heading text-8xl font-black gold-text mb-4">404</h1>
      <p className="text-xl font-heading text-[var(--text-1)] mb-2">Page Not Found</p>
      <p className="text-[var(--text-2)] mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-[var(--primary)] text-black font-semibold hover:bg-[var(--primary-dim)] transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
