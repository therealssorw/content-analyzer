"use client";

import { useState, useEffect } from "react";
import UserMenu from "./components/UserMenu";
import { ScoreRing, MiniScore } from "./components/ScoreRing";
import { HowItWorks, Testimonials, Footer } from "./components/LandingSections";
import { PricingSection } from "./components/PricingSection";
import { RewriteHook } from "./components/RewriteHook";

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

interface HistoryEntry {
  id: string;
  content: string;
  type: "tweet" | "article";
  result: AnalysisResult;
  timestamp: number;
}

const URL_REGEX = /^https?:\/\/[^\s]+$/;
const FREE_LIMIT = 5;
const HISTORY_KEY = "cl_history";
const MAX_HISTORY = 20;

function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch { return []; }
}

function saveToHistory(entry: Omit<HistoryEntry, "id">) {
  const history = getHistory();
  history.unshift({ ...entry, id: crypto.randomUUID() });
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function deleteFromHistory(id: string) {
  const history = getHistory().filter(h => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function getUsage(): { count: number; month: string } {
  if (typeof window === "undefined") return { count: 0, month: "" };
  const now = new Date();
  const month = `${now.getFullYear()}-${now.getMonth()}`;
  const stored = localStorage.getItem("cl_usage");
  if (stored) {
    const data = JSON.parse(stored);
    if (data.month === month) return data;
  }
  return { count: 0, month };
}

function incrementUsage() {
  const usage = getUsage();
  usage.count++;
  localStorage.setItem("cl_usage", JSON.stringify(usage));
}

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto mt-12 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-[120px] h-[120px] rounded-full shimmer" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-48 rounded shimmer" />
          <div className="h-4 w-full rounded shimmer" />
          <div className="h-4 w-3/4 rounded shimmer" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 rounded-xl shimmer" />
      ))}
    </div>
  );
}

export default function Home() {
  const [content, setContent] = useState("");
  const [type, setType] = useState<"tweet" | "article" | "auto">("auto");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [usage, setUsage] = useState({ count: 0, month: "" });
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [urlSource, setUrlSource] = useState<string | null>(null);

  useEffect(() => {
    setUsage(getUsage());
    setHistory(getHistory());
    fetch("/api/pro-status").then(r => r.json()).then(d => { if (d.pro) setIsPro(true); }).catch(() => {});
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("upgraded")) {
      setIsPro(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const fetchFromUrl = async (url: string) => {
    setFetchingUrl(true);
    setUrlSource(null);
    setError("");
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch URL");
        return;
      }
      setContent(data.content);
      setType("article");
      setUrlSource(data.title ? `${data.title} (${data.source})` : data.source);
    } catch {
      setError("Failed to fetch URL");
    } finally {
      setFetchingUrl(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (URL_REGEX.test(pasted) && (pasted.includes("substack.com") || pasted.includes("medium.com") || pasted.includes("beehiiv.com"))) {
      e.preventDefault();
      setContent(pasted);
      fetchFromUrl(pasted);
    }
  };

  const remaining = isPro ? Infinity : FREE_LIMIT - usage.count;
  const isLimited = !isPro && remaining <= 0;

  const analyze = async () => {
    if (!content.trim() || isLimited) return;
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
      const data = await res.json();
      setResult(data);
      saveToHistory({ content, type: (data.detectedType || type) as "tweet" | "article", result: data, timestamp: Date.now() });
      setHistory(getHistory());
      incrementUsage();
      setUsage(getUsage());
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-12 md:py-20">
      {/* Nav */}
      <nav className="max-w-3xl mx-auto flex items-center justify-between mb-8">
        <div />
        <UserMenu />
      </nav>

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
          Paste your X post or Substack article. Get instant AI feedback on what makes people stop, read, and engage.
        </p>
      </div>

      {/* Input Section */}
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 mb-4">
          {(["auto", "tweet", "article"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === t
                  ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border)]"
              }`}
            >
              {t === "auto" ? "🔍 Auto-detect" : t === "tweet" ? "𝕏 Post" : "📝 Substack Article"}
            </button>
          ))}
        </div>

        {fetchingUrl && (
          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--accent)]">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Fetching article content...
          </div>
        )}
        {urlSource && !fetchingUrl && (
          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span className="text-[var(--accent)]">✓</span> Imported from <span className="text-[var(--accent-light)]">{urlSource}</span>
            <button onClick={() => { setUrlSource(null); setContent(""); }} className="ml-auto text-xs hover:text-[var(--danger)] transition-colors">✕ Clear</button>
          </div>
        )}

        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 15000))}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); analyze(); } }}
            onPaste={handlePaste}
            placeholder={type === "tweet" ? "Paste your X post here..." : "Paste your Substack article or URL here..."}
            className="w-full h-48 md:h-56 p-5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 resize-none focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/50 transition-all text-base leading-relaxed"
          />
          <div className="absolute bottom-3 right-3 text-xs text-[var(--text-secondary)]">
            {content.length.toLocaleString()} / 15,000
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 mb-1">
          <span className="text-xs text-[var(--text-secondary)]">
            {isPro ? (
              <span className="text-[var(--accent)]">✨ Pro — Unlimited analyses</span>
            ) : isLimited ? (
              <span className="text-[var(--danger)]">Free limit reached — upgrade for unlimited</span>
            ) : (
              <>{remaining} free {remaining === 1 ? "analysis" : "analyses"} left this month</>
            )}
          </span>
          {!isPro && <span className="text-xs text-[var(--text-secondary)]">{usage.count}/{FREE_LIMIT}</span>}
        </div>
        {!isPro && (
          <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all ${isLimited ? "bg-[var(--danger)]" : "bg-[var(--accent)]"}`}
              style={{ width: `${Math.min(100, (usage.count / FREE_LIMIT) * 100)}%` }}
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        <button
          onClick={analyze}
          disabled={loading || !content.trim() || isLimited}
          className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--accent)]/20 text-base"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Analyzing...
            </span>
          ) : isLimited ? "Upgrade to Pro for Unlimited Analyses" : (
            <span className="flex items-center justify-center gap-2">
              Analyze Content
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono">⌘↵</kbd>
            </span>
          )}
        </button>
      </div>

      {loading && <LoadingSkeleton />}

      {/* Results */}
      {result && !loading && (
        <div className="max-w-3xl mx-auto mt-12 space-y-6">
          {result.mock && (
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] text-xs">
                ⚡ Demo Mode — AI analysis coming soon
              </span>
            </div>
          )}

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

          <div className="fade-up fade-up-delay-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🎣</span>
              <h3 className="text-lg font-bold">Hook Strength</h3>
              <span className="ml-auto text-sm font-semibold px-3 py-1 rounded-full bg-[var(--bg-tertiary)]">{result.hookStrength.score}/100</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">{result.hookStrength.feedback}</p>
          </div>

          <div className="fade-up fade-up-delay-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🏗️</span>
              <h3 className="text-lg font-bold">Structure & Readability</h3>
              <span className="ml-auto text-sm font-semibold px-3 py-1 rounded-full bg-[var(--bg-tertiary)]">{result.structure.score}/100</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">{result.structure.feedback}</p>
          </div>

          <div className="fade-up fade-up-delay-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💡</span>
              <h3 className="text-lg font-bold">Emotional Triggers</h3>
              <span className="ml-auto text-sm font-semibold px-3 py-1 rounded-full bg-[var(--bg-tertiary)]">{result.emotionalTriggers.score}/100</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">{result.emotionalTriggers.feedback}</p>
            <div className="flex flex-wrap gap-2">
              {result.emotionalTriggers.triggers.map((t) => (
                <span key={t} className="px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent-light)] text-sm">
                  {t}
                </span>
              ))}
            </div>
          </div>

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

          {result.readability && (
            <div className="fade-up fade-up-delay-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📖</span>
                <h3 className="text-lg font-bold">Readability</h3>
                <span className={`ml-auto text-2xl font-bold ${
                  result.readability.fleschReadingEase >= 60 ? "text-emerald-400" :
                  result.readability.fleschReadingEase >= 40 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {result.readability.fleschReadingEase}
                </span>
              </div>
              <p className="text-[var(--text-secondary)] text-sm mb-3">{result.readability.gradeLevel}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="text-lg font-bold text-white">{result.readability.wordCount}</div>
                  <div className="text-xs text-[var(--text-secondary)]">Words</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="text-lg font-bold text-white">{result.readability.sentenceCount}</div>
                  <div className="text-xs text-[var(--text-secondary)]">Sentences</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="text-lg font-bold text-white">{Math.round(result.readability.avgSentenceLength)}</div>
                  <div className="text-xs text-[var(--text-secondary)]">Avg Words/Sent</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="text-lg font-bold text-white">
                    {result.readability.readingTimeSeconds < 60
                      ? `${result.readability.readingTimeSeconds}s`
                      : `${Math.round(result.readability.readingTimeSeconds / 60)}m`}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">Read Time</div>
                </div>
              </div>
              {result.readability.suggestions.length > 0 && (
                <ul className="space-y-2">
                  {result.readability.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-yellow-400">⚡</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {result.tone && (
            <div className="fade-up fade-up-delay-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🎭</span>
                <h3 className="text-lg font-bold">Tone & Voice</h3>
                <span className="ml-auto text-sm font-medium text-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1 rounded-full">
                  {result.tone.voice}
                </span>
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
                    <span key={trait} className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                      {trait}
                    </span>
                  ))}
                </div>
              )}
              {result.tone.suggestions.length > 0 && (
                <ul className="space-y-2">
                  {result.tone.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-purple-400">💡</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <RewriteHook content={content} type={type} analysis={result} />

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => { setResult(null); setContent(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="px-5 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent)] transition-all text-sm"
            >
              ← Analyze Another
            </button>
            <button
              onClick={() => {
                const text = `ContentLens Score: ${result.overallScore}/100\n\n🎣 Hook: ${result.hookStrength.score}/100\n🏗️ Structure: ${result.structure.score}/100\n💡 Emotion: ${result.emotionalTriggers.score}/100\n\nKey improvements:\n${result.improvements.map(i => `→ ${i}`).join("\n")}\n\n${result.summary}`;
                navigator.clipboard.writeText(text).then(() => setCopied(true));
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-5 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent)] transition-all text-sm"
            >
              {copied ? "✓ Copied!" : "📋 Copy"}
            </button>
            <button
              onClick={async () => {
                const res = await fetch("/api/export", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ result, content, type }),
                });
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `contentlens-report-${Date.now()}.md`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-5 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent)] transition-all text-sm"
            >
              📄 Export Report
            </button>
            <a href="/compare"
              className="px-5 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent)] transition-all text-sm inline-block"
            >
              ⚖️ Compare
            </a>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="max-w-3xl mx-auto mt-16">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors mb-4"
          >
            <span className="text-lg">📊</span>
            <span className="font-semibold">Analysis History</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)]">{history.length}</span>
            <span className="text-xs ml-1">{showHistory ? "▲" : "▼"}</span>
            {showHistory && (
              <button
                onClick={(e) => { e.stopPropagation(); localStorage.removeItem(HISTORY_KEY); setHistory([]); }}
                className="ml-auto text-xs text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors"
              >Clear all</button>
            )}
          </button>
          {showHistory && (
            <div className="space-y-3">
              {history.map((entry) => {
                const date = new Date(entry.timestamp);
                const preview = entry.content.slice(0, 80) + (entry.content.length > 80 ? "…" : "");
                const scoreColor = entry.result.overallScore >= 75 ? "text-[#00b894]" : entry.result.overallScore >= 50 ? "text-[#fdcb6e]" : "text-[#e17055]";
                return (
                  <div
                    key={entry.id}
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/50 transition-all cursor-pointer group"
                    onClick={() => { setContent(entry.content); setType(entry.type); setResult(entry.result); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                            {entry.type === "tweet" ? "𝕏" : "📝"}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)]">
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] truncate">{preview}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${scoreColor}`}>{entry.result.overallScore}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteFromHistory(entry.id); setHistory(getHistory()); }}
                          className="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-all text-sm"
                          title="Delete"
                        >✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!result && <HowItWorks />}
      {!result && <Testimonials />}
      <PricingSection isPro={isPro} />
      <Footer />
    </main>
  );
}
