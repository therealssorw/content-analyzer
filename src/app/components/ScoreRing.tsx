"use client";

export function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#00b894" : score >= 50 ? "#fdcb6e" : "#e17055";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#2a2a3e" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="score-ring"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-[var(--text-secondary)]">/ 100</span>
      </div>
    </div>
  );
}

export function MiniScore({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? "bg-[#00b894]" : score >= 50 ? "bg-[#fdcb6e]" : "bg-[#e17055]";
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-sm font-semibold w-8 text-right">{score}</span>
      </div>
    </div>
  );
}
