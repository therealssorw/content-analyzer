"use client";

import { useState } from "react";
import Link from "next/link";

export default function Pricing() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-12 md:py-20">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Link href="/" className="text-[var(--accent-light)] text-sm hover:underline mb-6 inline-block">
          ← Back to analyzer
        </Link>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
          Start free. Upgrade when you need AI-powered deep analysis.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        {/* Free Tier */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8">
          <div className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">Free</div>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-extrabold">$0</span>
            <span className="text-[var(--text-secondary)]">/month</span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            Perfect for getting started with content analysis.
          </p>
          <ul className="space-y-3 mb-8">
            {[
              "Rule-based content analysis",
              "Hook, structure & emotion scores",
              "Readability metrics",
              "Tone & voice analysis",
              "Unlimited analyses",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span className="text-[var(--text-secondary)]">{f}</span>
              </li>
            ))}
          </ul>
          <Link href="/"
            className="block w-full py-3 rounded-xl text-center font-semibold bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent)] transition-all text-sm">
            Get Started Free
          </Link>
        </div>

        {/* Pro Tier */}
        <div className="relative bg-[var(--bg-secondary)] border-2 border-[var(--accent)] rounded-2xl p-8">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--accent)] text-white text-xs font-bold uppercase">
            Most Popular
          </div>
          <div className="text-sm font-medium text-[var(--accent-light)] uppercase tracking-wider mb-2">Pro</div>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-extrabold">$9</span>
            <span className="text-[var(--text-secondary)]">/month</span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            AI-powered deep analysis for serious creators.
          </p>
          <ul className="space-y-3 mb-8">
            {[
              "Everything in Free",
              "AI-powered deep analysis (Claude)",
              "Specific rewrite suggestions",
              "Competitor comparison insights",
              "Analysis history (last 50)",
              "Batch analysis (up to 5 at once)",
              "Export results to PDF",
              "Priority support",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <span className="text-[var(--accent-light)] mt-0.5">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <button onClick={handleCheckout} disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] hover:opacity-90 disabled:opacity-40 transition-all text-sm shadow-lg shadow-[var(--accent)]/20">
            {loading ? "Redirecting..." : "Upgrade to Pro →"}
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-16 space-y-6">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        {[
          {
            q: "What's the difference between free and AI analysis?",
            a: "Free analysis uses rule-based algorithms for instant scoring. Pro uses Claude AI for deeper, context-aware feedback with specific rewrite suggestions tailored to your content.",
          },
          {
            q: "Can I cancel anytime?",
            a: "Yes! No contracts, no commitments. Cancel your subscription anytime from your billing dashboard.",
          },
          {
            q: "What payment methods do you accept?",
            a: "We accept all major credit cards, debit cards, and Google Pay through our secure Stripe payment system.",
          },
        ].map(({ q, a }) => (
          <div key={q} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
            <h3 className="font-semibold mb-2">{q}</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      {/* AI Transparency Footer */}
      <footer className="max-w-3xl mx-auto mt-16 pt-8 border-t border-[var(--border)] text-center pb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
          <span>🤖</span>
          <span>Built &amp; operated by AI agents · Human board oversight</span>
        </div>
      </footer>
    </main>
  );
}
