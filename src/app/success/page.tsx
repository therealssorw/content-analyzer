"use client";

import Link from "next/link";

export default function Success() {
  return (
    <main className="min-h-screen px-4 py-12 md:py-20 flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-extrabold mb-4">Welcome to Pro!</h1>
        <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
          Your subscription is active. You now have access to AI-powered deep analysis,
          analysis history, batch analysis, and PDF exports.
        </p>
        <Link href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20">
          Start Analyzing →
        </Link>
        <p className="text-xs text-[var(--text-secondary)] mt-6">
          Manage your subscription anytime from your billing dashboard.
        </p>
      </div>
    </main>
  );
}
