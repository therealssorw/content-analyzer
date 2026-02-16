"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">💥</div>
        <h1 className="text-2xl font-bold mb-2">Something broke</h1>
        <p className="text-[var(--text-secondary)] mb-6">
          Don&apos;t worry — your data is safe. This is probably a temporary glitch.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] hover:opacity-90 transition-all"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
