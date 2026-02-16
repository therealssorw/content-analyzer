"use client";

export function PricingSection({ isPro }: { isPro: boolean }) {
  return (
    <div className="max-w-4xl mx-auto mt-20 mb-12 px-4">
      <h2 className="text-3xl font-extrabold text-center mb-3">Level Up Your Content Game</h2>
      <p className="text-center text-[var(--text-secondary)] mb-10 max-w-lg mx-auto">
        Free gets you started. Pro makes you dangerous.
      </p>
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Free */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-1">Free</h3>
          <p className="text-[var(--text-secondary)] text-sm mb-4">Try it out</p>
          <div className="text-3xl font-extrabold mb-6">$0<span className="text-sm font-normal text-[var(--text-secondary)]">/mo</span></div>
          <ul className="space-y-2.5 text-sm">
            {["5 analyses per month", "Hook, structure & emotion scores", "Actionable improvements", "X posts & Substack articles"].map((f) => (
              <li key={f} className="flex gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--accent)]">✓</span> {f}
              </li>
            ))}
          </ul>
          <div className="mt-6 py-2.5 text-center text-sm rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
            {isPro ? "Previous Plan" : "Current Plan"}
          </div>
        </div>

        {/* Pro */}
        <div className="bg-[var(--bg-secondary)] border-2 border-[var(--accent)] rounded-2xl p-6 relative glow">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[var(--accent)] text-white text-xs font-bold rounded-full">
            POPULAR
          </div>
          <h3 className="text-lg font-bold mb-1">Pro</h3>
          <p className="text-[var(--text-secondary)] text-sm mb-4">For serious creators</p>
          <div className="text-3xl font-extrabold mb-6">$9<span className="text-sm font-normal text-[var(--text-secondary)]">/mo</span></div>
          <ul className="space-y-2.5 text-sm">
            {[
              "Unlimited analyses",
              "Analysis history & trends",
              "Compare posts side-by-side",
              "Export reports",
              "Priority AI model",
              "Early access to new tools",
            ].map((f) => (
              <li key={f} className="flex gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--accent)]">✓</span> {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <button
              onClick={async () => {
                const res = await fetch("/api/portal", { method: "POST" });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              }}
              className="mt-6 w-full py-2.5 text-center text-sm font-semibold rounded-lg bg-[var(--bg-tertiary)] text-white hover:opacity-90 transition-all"
            >
              ✨ Manage Subscription
            </button>
          ) : (
            <button
              onClick={async () => {
                const res = await fetch("/api/checkout", { method: "POST" });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
                else if (data.error === "Sign in to upgrade") window.location.href = "/auth";
                else alert(data.error || "Payments coming soon");
              }}
              className="mt-6 w-full py-2.5 text-center text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] text-white hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
