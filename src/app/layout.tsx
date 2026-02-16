import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://contentlens.app";

export const metadata: Metadata = {
  title: "ContentLens — Analyze Your Content. Grow Your Brand.",
  description:
    "AI-powered content analysis for personal brands. Paste your X post or Substack article, get instant feedback on hooks, structure, emotional triggers, and actionable improvements.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "ContentLens — AI Content Analysis for Creators",
    description:
      "Paste your content. Get a score. Know exactly what to fix. Free for 5 analyses/month.",
    url: BASE_URL,
    siteName: "ContentLens",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "ContentLens — AI Content Analysis" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ContentLens — AI Content Analysis for Creators",
    description: "Paste your content. Get a score. Know exactly what to fix.",
    images: ["/api/og"],
  },
  keywords: [
    "content analysis",
    "AI writing feedback",
    "X post analyzer",
    "Substack analyzer",
    "hook strength",
    "content score",
    "personal brand",
    "creator tools",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
