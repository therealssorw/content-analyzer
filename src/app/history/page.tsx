"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Analysis {
  id: string;
  content_preview: string;
  content_type: string;
  overall_score: number;
  created_at: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? "text-green-400 bg-green-400/10" : score >= 50 ? "text-amber-400 bg-amber-400/10" : "text-red-400 bg-red-400/10";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${color}`}>
      {score}
    </span>
  );
}

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (!data.user) setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/history?page=${page}`)
      .then(r => r.json())
      .then(data => {
        setAnalyses(data.analyses);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [user, page]);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-2 inline-block">← Back to Analyzer</a>
            <h1 className="text-3xl font-bold">Analysis History</h1>
            {total > 0 && <p className="text-[var(--text-secondary)] text-sm mt-1">{total} total analyses</p>}
          </div>
        </div>

        {/* Not logged in */}
        {!loading && !user && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-bold mb-2">Sign in to view your history</h2>
            <p className="text-[var(--text-secondary)] mb-6">Your past analyses are saved automatically when you&apos;re logged in.</p>
            <a href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] hover:opacity-90 transition-all">
              Sign In →
            </a>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[var(--text-secondary)]">Loading your analyses...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && user && analyses.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-bold mb-2">No analyses yet</h2>
            <p className="text-[var(--text-secondary)] mb-6">Analyze your first piece of content to start building your history.</p>
            <a href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] hover:opacity-90 transition-all">
              Analyze Content →
            </a>
          </div>
        )}

        {/* Analysis list */}
        {!loading && analyses.length > 0 && (
          <div className="space-y-3">
            {analyses.map((a) => (
              <div key={a.id} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] uppercase tracking-wider">
                        {a.content_type || "text"}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] truncate">{a.content_preview}</p>
                  </div>
                  <ScoreBadge score={a.overall_score} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm disabled:opacity-40 hover:border-[var(--accent)]/30 transition-colors">
              ← Previous
            </button>
            <span className="text-sm text-[var(--text-secondary)]">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm disabled:opacity-40 hover:border-[var(--accent)]/30 transition-colors">
              Next →
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[var(--border)] text-center pb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
            <span>🤖</span>
            <span>Built &amp; operated by AI agents · Human board oversight</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
