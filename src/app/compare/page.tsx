"use client";

import { useState } from "react";
import Link from "next/link";

interface AnalysisResult {
  overallScore: number;
  hookStrength: { score: number; feedback: string };
  structure: { score: number; feedback: string };
  emotionalTriggers: { score: number; feedback: string; triggers: string[] };
  improvements: string[];
  summary: string;
  mock?: boolean;
  provider?: string;
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#00b894" : score >= 50 ? "#fdcb6e" : "#e17055";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#2a2a3e" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} className="score-ring" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, scoreA, scoreB }: { label: string; scoreA: number; scoreB: number }) {
  const colorA = scoreA >= 75 ? "#00b894" : scoreA >= 50 ? "#fdcb6e" : "#e17055";
  const colorB = scoreB >= 75 ? "#00b894" : scoreB >= 50 ? "#fdcb6e" : "#e17055";
  const diff = scoreA - scoreB;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className={`text-xs font-semibold ${diff > 0 ? "text-[#00b894]" : diff < 0 ? "text-[#e17055]" : "text-[var(--text-secondary)]"}`}>
          {diff > 0 ? `+${diff}` : diff === 0 ? "tie" : `${diff}`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${scoreA}%`, backgroundColor: colorA }} />
          </div>
          <span className="text-xs font-semibold w-6 text-right">{scoreA}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${scoreB}%`, backgroundColor: colorB }} />
          </div>
          <span className="text-xs font-semibold w-6 text-right">{scoreB}</span>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [contentA, setContentA] = useState("");
  const [contentB, setContentB] = useState("");
  const [typeA, setTypeA] = useState<"tweet" | "article">("tweet");
  const [typeB, setTypeB] = useState<"tweet" | "article">("tweet");
  const [resultA, setResultA] = useState<AnalysisResult | null>(null);
  const [resultB, setResultB] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!contentA.trim() || !contentB.trim()) return;
    setLoading(true);
    setError("");
    setResultA(null);
    setResultB(null);
    try {
      const [resA, resB] = await Promise.all([
        fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: contentA, type: typeA }) }),
        fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: contentB, type: typeB }) }),
      ]);
      if (!resA.ok || !resB.ok) { setError("Analysis failed. Please try again."); return; }
      const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);
      setResultA(dataA);
      setResultB(dataB);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const winner = resultA && resultB
    ? resultA.overallScore > resultB.overallScore ? "A" : resultB.overallScore > resultA.overallScore ? "B" : "tie"
    : null;

  return (
    <main className="min-h-screen px-4 py-12 md:py-20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-[var(--text-secondary)] hover:text-white transition-colors text-sm">← Back to Analyzer</Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent-light)] text-xs">
            ✨ Pro Feature
          </span>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
            Compare <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)]">Side-by-Side</span>
          </h1>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
            Pit two versions against each other. See which hook hits harder, which structure flows better.
          </p>
        </div>

        {/* Input Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Version A */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold">A</span>
              <span className="text-sm font-semibold">Version A</span>
              <div className="ml-auto flex gap-1">
                {(["tweet", "article"] as const).map(t => (
                  <button key={t} onClick={() => setTypeA(t)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${typeA === t ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>
                    {t === "tweet" ? "𝕏" : "📝"}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={contentA} onChange={e => setContentA(e.target.value.slice(0, 15000))}
              placeholder="Paste version A..."
              className="w-full h-40 p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 resize-none focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/50 transition-all text-sm leading-relaxed" />
          </div>

          {/* Version B */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#ec4899] flex items-center justify-center text-white text-sm font-bold">B</span>
              <span className="text-sm font-semibold">Version B</span>
              <div className="ml-auto flex gap-1">
                {(["tweet", "article"] as const).map(t => (
                  <button key={t} onClick={() => setTypeB(t)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${typeB === t ? "bg-[#ec4899] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>
                    {t === "tweet" ? "𝕏" : "📝"}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={contentB} onChange={e => setContentB(e.target.value.slice(0, 15000))}
              placeholder="Paste version B..."
              className="w-full h-40 p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 resize-none focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/50 transition-all text-sm leading-relaxed" />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-sm text-center">{error}</div>
        )}

        <button onClick={analyze} disabled={loading || !contentA.trim() || !contentB.trim()}
          className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--accent)] to-[#ec4899] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--accent)]/20 text-base mb-12">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Analyzing both...
            </span>
          ) : "Compare Content"}
        </button>

        {/* Results */}
        {resultA && resultB && (
          <div className="space-y-8">
            {/* Winner Banner */}
            <div className="text-center fade-up">
              {winner === "tie" ? (
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-lg font-bold">
                  🤝 It&apos;s a Tie — {resultA.overallScore}/100
                </div>
              ) : (
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--accent)] glow text-lg font-bold">
                  🏆 Version {winner} Wins — {winner === "A" ? resultA.overallScore : resultB.overallScore} vs {winner === "A" ? resultB.overallScore : resultA.overallScore}
                </div>
              )}
            </div>

            {/* Score Comparison */}
            <div className="fade-up fade-up-delay-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <ScoreRing score={resultA.overallScore} />
                  <div>
                    <div className="text-sm font-semibold">Version A</div>
                    <div className="text-xs text-[var(--text-secondary)]">{resultA.overallScore}/100</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-[var(--text-secondary)]">VS</div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold">Version B</div>
                    <div className="text-xs text-[var(--text-secondary)]">{resultB.overallScore}/100</div>
                  </div>
                  <ScoreRing score={resultB.overallScore} />
                </div>
              </div>

              <div className="space-y-4">
                <ScoreBar label="🎣 Hook Strength" scoreA={resultA.hookStrength.score} scoreB={resultB.hookStrength.score} />
                <ScoreBar label="🏗️ Structure" scoreA={resultA.structure.score} scoreB={resultB.structure.score} />
                <ScoreBar label="💡 Emotional Pull" scoreA={resultA.emotionalTriggers.score} scoreB={resultB.emotionalTriggers.score} />
              </div>
            </div>

            {/* Detailed Feedback Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Version A Details */}
              <div className="space-y-4 fade-up fade-up-delay-2">
                <h3 className="flex items-center gap-2 font-bold">
                  <span className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs">A</span>
                  Version A Feedback
                </h3>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 space-y-3">
                  <div><span className="text-xs font-semibold text-[var(--text-secondary)]">Hook</span><p className="text-sm text-[var(--text-secondary)] mt-1">{resultA.hookStrength.feedback}</p></div>
                  <div><span className="text-xs font-semibold text-[var(--text-secondary)]">Structure</span><p className="text-sm text-[var(--text-secondary)] mt-1">{resultA.structure.feedback}</p></div>
                  <div><span className="text-xs font-semibold text-[var(--text-secondary)]">Emotion</span><p className="text-sm text-[var(--text-secondary)] mt-1">{resultA.emotionalTriggers.feedback}</p></div>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Improvements</span>
                  <ul className="mt-2 space-y-1.5">
                    {resultA.improvements.map((imp, i) => (
                      <li key={i} className="text-sm text-[var(--text-secondary)] flex gap-2"><span className="text-[var(--accent)]">→</span>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Version B Details */}
              <div className="space-y-4 fade-up fade-up-delay-3">
                <h3 className="flex items-center gap-2 font-bold">
                  <span className="w-6 h-6 rounded-full bg-[#ec4899] flex items-center justify-center text-white text-xs">B</span>
                  Version B Feedback
                </h3>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 space-y-3">
                  <div><span className="text-xs font-semibold text-[var(--text-secondary)]">Hook</span><p className="text-sm text-[var(--text-secondary)] mt-1">{resultB.hookStrength.feedback}</p></div>
                  <div><span className="text-xs font-semibold text-[var(--text-secondary)]">Structure</span><p className="text-sm text-[var(--text-secondary)] mt-1">{resultB.structure.feedback}</p></div>
                  <div><span className="text-xs font-semibold text-[var(--text-secondary)]">Emotion</span><p className="text-sm text-[var(--text-secondary)] mt-1">{resultB.emotionalTriggers.feedback}</p></div>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Improvements</span>
                  <ul className="mt-2 space-y-1.5">
                    {resultB.improvements.map((imp, i) => (
                      <li key={i} className="text-sm text-[var(--text-secondary)] flex gap-2"><span className="text-[#ec4899]">→</span>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Analyze Again */}
            <div className="text-center pt-4">
              <button onClick={() => { setResultA(null); setResultB(null); setContentA(""); setContentB(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="px-6 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent)] transition-all">
                ← Compare Again
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
