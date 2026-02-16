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
  readability?: {
    fleschReadingEase: number;
    gradeLevel: string;
    avgSentenceLength: number;
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    longSentences: number;
    passiveVoiceEstimate: number;
    readingTimeSeconds: number;
    suggestions: string[];
  };
  tone?: {
    formality: { level: string; score: number };
    confidence: { level: string; score: number };
    voice: string;
    personality: string[];
    suggestions: string[];
  };
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-[120px] h-[120px] flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
        <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} className="score-ring" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function MiniScore({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--text-secondary)] w-28">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-semibold w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

export default function Home() {
  const [content, setContent] = useState("");
  const [type, setType] = useState<"tweet" | "article" | "auto">("auto");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const analyze = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Analysis failed");
        return;
      }
      setResult(await res.json());
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-12 md:py-20">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent-light)] text-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          AI-Powered Content Analysis
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          Content<span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)]">Lens</span>
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
          Paste your X post or Substack article. Get instant feedback on what makes people stop, read, and engage.
        </p>
      </div>

      {/* Input */}
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 mb-4">
          {(["auto", "tweet", "article"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === t
                  ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border)]"
              }`}>
              {t === "auto" ? "🔍 Auto-detect" : t === "tweet" ? "𝕏 Post" : "📝 Article"}
            </button>
          ))}
        </div>

        <div className="relative">
          <textarea value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 15000))}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); analyze(); } }}
            placeholder="Paste your content here..."
            className="w-full h-48 md:h-56 p-5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 resize-none focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/50 transition-all text-base leading-relaxed" />
          <div className="absolute bottom-3 right-3 text-xs text-[var(--text-secondary)]">
            {content.length.toLocaleString()} / 15,000
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        <button onClick={analyze} disabled={loading || !content.trim()}
          className="w-full mt-4 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--accent)]/20 text-base">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Analyzing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Analyze Content
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono">⌘↵</kbd>
            </span>
          )}
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="max-w-3xl mx-auto mt-12 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-[120px] h-[120px] rounded-full shimmer" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-48 rounded shimmer" />
              <div className="h-4 w-full rounded shimmer" />
              <div className="h-4 w-3/4 rounded shimmer" />
            </div>
          </div>
          {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl shimmer" />)}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="max-w-3xl mx-auto mt-12 space-y-6">
          {result.mock && (
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] text-xs">
                ⚡ Demo Mode — using rule-based analysis (no AI key configured)
              </span>
            </div>
          )}

          {/* Overall Score */}
          <div className="fade-up bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            <ScoreRing score={result.overallScore} />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold mb-2">Overall Score</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">{result.summary}</p>
              <div className="mt-4 space-y-2">
                <MiniScore label="Hook Strength" score={result.hookStrength.score} />
                <MiniScore label="Structure" score={result.structure.score} />
                <MiniScore label="Emotional Pull" score={result.emotionalTriggers.score} />
              </div>
            </div>
          </div>

          {/* Hook */}
          <div className="fade-up fade-up-delay-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🎣</span>
              <h3 className="text-lg font-bold">Hook Strength</h3>
              <span className="ml-auto text-sm font-semibold px-3 py-1 rounded-full bg-[var(--bg-tertiary)]">{result.hookStrength.score}/100</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">{result.hookStrength.feedback}</p>
          </div>

          {/* Structure */}
          <div className="fade-up fade-up-delay-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🏗️</span>
              <h3 className="text-lg font-bold">Structure & Readability</h3>
              <span className="ml-auto text-sm font-semibold px-3 py-1 rounded-full bg-[var(--bg-tertiary)]">{result.structure.score}/100</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">{result.structure.feedback}</p>
          </div>

          {/* Emotional Triggers */}
          <div className="fade-up fade-up-delay-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💡</span>
              <h3 className="text-lg font-bold">Emotional Triggers</h3>
              <span className="ml-auto text-sm font-semibold px-3 py-1 rounded-full bg-[var(--bg-tertiary)]">{result.emotionalTriggers.score}/100</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">{result.emotionalTriggers.feedback}</p>
            <div className="flex flex-wrap gap-2">
              {result.emotionalTriggers.triggers.map((t) => (
                <span key={t} className="px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent-light)] text-sm">{t}</span>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div className="fade-up fade-up-delay-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🚀</span>
              <h3 className="text-lg font-bold">How to Improve</h3>
            </div>
            <ul className="space-y-3">
              {result.improvements.map((imp, i) => (
                <li key={i} className="flex gap-3 text-[var(--text-secondary)]">
                  <span className="text-[var(--accent)] font-bold mt-0.5">→</span>
                  <span className="leading-relaxed">{imp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Readability */}
          {result.readability && (
            <div className="fade-up bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📖</span>
                <h3 className="text-lg font-bold">Readability</h3>
                <span className={`ml-auto text-2xl font-bold ${
                  result.readability.fleschReadingEase >= 60 ? "text-emerald-400" :
                  result.readability.fleschReadingEase >= 40 ? "text-yellow-400" : "text-red-400"
                }`}>{result.readability.fleschReadingEase}</span>
              </div>
              <p className="text-[var(--text-secondary)] text-sm mb-3">{result.readability.gradeLevel}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { val: result.readability.wordCount, label: "Words" },
                  { val: result.readability.sentenceCount, label: "Sentences" },
                  { val: Math.round(result.readability.avgSentenceLength), label: "Avg Words/Sent" },
                  { val: result.readability.readingTimeSeconds < 60 ? `${result.readability.readingTimeSeconds}s` : `${Math.round(result.readability.readingTimeSeconds / 60)}m`, label: "Read Time" },
                ].map(({ val, label }) => (
                  <div key={label} className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)]">
                    <div className="text-lg font-bold text-white">{val}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{label}</div>
                  </div>
                ))}
              </div>
              {result.readability.suggestions.length > 0 && (
                <ul className="space-y-2">
                  {result.readability.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-yellow-400">⚡</span><span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Tone */}
          {result.tone && (
            <div className="fade-up bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🎭</span>
                <h3 className="text-lg font-bold">Tone & Voice</h3>
                <span className="ml-auto text-sm font-medium text-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1 rounded-full">{result.tone.voice}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Formality</div>
                  <div className="text-sm font-bold text-white capitalize">{result.tone.formality.level}</div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${result.tone.formality.score}%` }} />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Confidence</div>
                  <div className="text-sm font-bold text-white capitalize">{result.tone.confidence.level}</div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${result.tone.confidence.score}%` }} />
                  </div>
                </div>
              </div>
              {result.tone.personality.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {result.tone.personality.map((trait) => (
                    <span key={trait} className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">{trait}</span>
                  ))}
                </div>
              )}
              {result.tone.suggestions.length > 0 && (
                <ul className="space-y-2">
                  {result.tone.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-purple-400">💡</span><span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button onClick={() => { setResult(null); setContent(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="px-5 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent)] transition-all text-sm">
              ← Analyze Another
            </button>
            <button onClick={() => {
              const text = `ContentLens Score: ${result.overallScore}/100\n\n🎣 Hook: ${result.hookStrength.score}/100\n🏗️ Structure: ${result.structure.score}/100\n💡 Emotion: ${result.emotionalTriggers.score}/100\n\nKey improvements:\n${result.improvements.map(i => `→ ${i}`).join("\n")}\n\n${result.summary}`;
              navigator.clipboard.writeText(text).then(() => setCopied(true));
              setTimeout(() => setCopied(false), 2000);
            }}
              className="px-5 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent)] transition-all text-sm">
              {copied ? "✓ Copied!" : "📋 Copy Results"}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      {!result && (
        <div className="max-w-3xl mx-auto mt-20 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: "📝", title: "Paste", desc: "Drop in your X post or Substack article" },
              { icon: "🔍", title: "Analyze", desc: "Get scored on hook, structure, and emotion" },
              { icon: "🚀", title: "Improve", desc: "Follow actionable feedback to grow" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold mb-1">{title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[var(--text-secondary)] text-sm">
            Built for creators who want real feedback, not compliments.
          </p>
        </div>
      )}
    </main>
  );
}
