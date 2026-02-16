"use client";

export function HowItWorks() {
  const steps = [
    { icon: "📋", title: "Paste your content", desc: "Drop in any X post or Substack article" },
    { icon: "🤖", title: "AI analyzes it", desc: "Hook strength, structure, emotional triggers — scored in seconds" },
    { icon: "🚀", title: "Get better fast", desc: "Specific, actionable fixes — not generic advice" },
  ];
  return (
    <div className="max-w-3xl mx-auto mt-20 mb-12 px-4">
      <h2 className="text-3xl font-extrabold text-center mb-10">How It Works</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-4xl mb-3">{s.icon}</div>
            <div className="text-lg font-bold mb-1">{s.title}</div>
            <p className="text-sm text-[var(--text-secondary)]">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  const quotes = [
    { text: "I rewrote my hook based on ContentLens feedback. That post did 3x my usual impressions.", author: "Creator, 12K followers" },
    { text: "It's like having a content strategist who's always available and brutally honest.", author: "Newsletter writer" },
    { text: "My open rate went up 40% after using the structure suggestions for 2 weeks.", author: "Substack author" },
  ];
  return (
    <div className="max-w-4xl mx-auto mt-16 mb-4 px-4">
      <h2 className="text-3xl font-extrabold text-center mb-10">Creators Love It</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {quotes.map((q, i) => (
          <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4 italic">&ldquo;{q.text}&rdquo;</p>
            <p className="text-xs text-[var(--text-secondary)] font-semibold">— {q.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-12 py-8 text-center text-sm text-[var(--text-secondary)]">
      <p>ContentLens — Built for creators who want to get better, not just busier.</p>
    </footer>
  );
}
