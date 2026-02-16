"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = "/";
      }
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary, #0a0a0a)" }}>
      <div className="w-full max-w-md p-8 rounded-2xl" style={{ background: "var(--bg-secondary, #141414)", border: "1px solid var(--border, #262626)" }}>
        <Link href="/" className="block text-center mb-8">
          <span className="text-2xl font-bold" style={{ color: "var(--text-primary, #fafafa)" }}>
            Content<span style={{ color: "var(--accent, #6366f1)" }}>Lens.ai</span>
          </span>
        </Link>

        <h1 className="text-xl font-semibold text-center mb-6" style={{ color: "var(--text-primary, #fafafa)" }}>
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 px-4 rounded-xl font-medium mb-4 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          style={{ background: "var(--bg-tertiary, #1e1e1e)", color: "var(--text-primary, #fafafa)", border: "1px solid var(--border, #262626)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "var(--border, #262626)" }} />
          <span className="text-sm" style={{ color: "var(--text-tertiary, #666)" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "var(--border, #262626)" }} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full py-3 px-4 rounded-xl text-sm outline-none"
            style={{ background: "var(--bg-tertiary, #1e1e1e)", color: "var(--text-primary, #fafafa)", border: "1px solid var(--border, #262626)" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full py-3 px-4 rounded-xl text-sm outline-none"
            style={{ background: "var(--bg-tertiary, #1e1e1e)", color: "var(--text-primary, #fafafa)", border: "1px solid var(--border, #262626)" }}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-green-400">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
            style={{ background: "var(--accent, #6366f1)" }}
          >
            {loading ? "..." : isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-tertiary, #666)" }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }} className="underline cursor-pointer" style={{ color: "var(--accent, #6366f1)" }}>
            {isSignUp ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
