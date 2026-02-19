import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostPulse — Analyze Your Content. Grow Your Brand.",
  description: "Paste your X post or Substack article, get instant feedback on hooks, structure, emotional triggers, and improvements.",
  openGraph: {
    title: "PostPulse — Analyze Your Content. Grow Your Brand.",
    description: "AI-powered content analysis for X posts and Substack articles. Get scored on hooks, structure, and emotion.",
    url: "https://content-analyzer-kappa-nine.vercel.app",
    siteName: "PostPulse",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PostPulse — AI Content Analysis",
    description: "Paste your post. Get instant AI feedback on what makes people stop, read, and engage.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
