"use client";

import { useState } from "react";

interface AnalysisResult {
  overallScore: number;
  hookStrength: { score: number; feedback: string };
  structure: { score: number; feedback: string };
  emotionalTriggers: { score: number; feedback: string; triggers: string[] };
  improvements: string[];
  summary: string;
  mock?: boolean;
}

export function RewriteHook({ content, type, analysis }: { content: string; type: string; analysis: AnalysisResult }) {
  const [rewrites, setRewrites] = useState<{ style: string; hook: string; why: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [mock, setMock] = useState(false);

  const generate = async () => {
    if (rewrites.length > 0) { setOpen(!open); return; }
    setLoading(true);
    setOpen(true);
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type, analysis }),
      });
      const data = await res.json();
      setRewrites(data.rewrites || []);
      setMock(!!data.mock);
    } catch { setRewrites([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-up fade-up-delay-4">
      <button onClick={generate}
        className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#ec4899] to-[var(--accent)] hover:opacity-90 transition-all shadow-lg shadow-[#ec4899]/20 text-sm flex items-center justify-center gap-2">
        {loading ? (
          <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Generating rewrites...</>
        ) : rewrites.length > 0 ? (
          <>{open ? "▲ Hide" : "▼ Show"} Hook Rewrites</>
        ) : (
          <>✨ Rewrite My Hook (AI)</>
        )}
      </button>
      {open && rewrites.length > 0 && (
        <div className="mt-4 space-y-3">
          {mock && (
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] text-xs">
                ⚡ Demo rewrites — AI rewrites coming soon
              </span>
            </div>
          )}
          {rewrites.map((r, i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent-light)]">{r.style}</span>
                <button onClick={() => { navigator.clipboard.writeText(r.hook); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }}
                  className="text-xs text-[var(--text-secondary)] hover:text-white transition-colors">
                  {copiedIdx === i ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>
              <p className="text-[var(--text-primary)] leading-relaxed mb-2">&ldquo;{r.hook}&rdquo;</p>
              <p className="text-xs text-[var(--text-secondary)] italic">{r.why}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
