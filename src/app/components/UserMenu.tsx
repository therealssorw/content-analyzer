"use client";

import { useState, useEffect, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    router.refresh();
  };

  if (!isSupabaseConfigured) {
    return (
      <span className="px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
        Auth not configured
      </span>
    );
  }

  if (!user) {
    return (
      <a
        href="/auth"
        className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent)]/50 transition-all"
      >
        Sign In
      </a>
    );
  }

  const initial = (user.email?.[0] ?? "?").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center text-white font-bold text-sm hover:opacity-90 transition-all"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-xl py-2 z-50">
          <div className="px-4 py-2 border-b border-[var(--border)]">
            <p className="text-sm font-medium truncate">{user.email}</p>
            <p className="text-xs text-[var(--text-secondary)]">Free Plan</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)] transition-all"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
