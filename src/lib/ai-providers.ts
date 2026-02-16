/**
 * Multi-provider AI analysis engine.
 * Supports: Anthropic Claude, OpenAI GPT, Google Gemini
 * Falls back to mock if no API key is configured.
 * 
 * Priority: ANTHROPIC_API_KEY > OPENAI_API_KEY > GOOGLE_AI_API_KEY > mock
 */

import { runSmartAnalysis } from "./content-analysis";

export interface AnalysisResult {
  overallScore: number;
  hookStrength: { score: number; feedback: string };
  structure: { score: number; feedback: string };
  emotionalTriggers: { score: number; feedback: string; triggers: string[] };
  improvements: string[];
  summary: string;
}

const SYSTEM_PROMPT = `You are an expert content analyst who helps personal brands improve their online writing. You specialize in viral content mechanics, copywriting psychology, and audience growth.

Analyze the given content and return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:

{
  "overallScore": <number 1-100>,
  "hookStrength": {
    "score": <number 1-100>,
    "feedback": "<2-3 sentences. Be specific about what works or doesn't in the opening. Reference the actual words used.>"
  },
  "structure": {
    "score": <number 1-100>,
    "feedback": "<2-3 sentences about readability, flow, formatting, paragraph length.>"
  },
  "emotionalTriggers": {
    "score": <number 1-100>,
    "feedback": "<2-3 sentences about psychological drivers present.>",
    "triggers": ["<list 2-5 emotional triggers detected, e.g. Curiosity, Fear of Missing Out, Authority, Social Proof, Contrarian, Vulnerability, Aspiration, Urgency>"]
  },
  "improvements": [
    "<4-5 specific, actionable improvements. Each should be 1 sentence. Be concrete — reference the actual content.>"
  ],
  "summary": "<2-3 sentence executive summary. What's the biggest win and biggest missed opportunity?>"
}

SCORING GUIDE:
- 90-100: Viral-tier content, exceptional craft
- 75-89: Strong content, minor optimizations needed
- 60-74: Decent but missing key elements
- 40-59: Needs significant work
- Below 40: Fundamental issues

Be honest and direct. Don't sugarcoat. Creators want real feedback, not compliments.`;

function parseAIResponse(raw: string): AnalysisResult {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned) as AnalysisResult;
}

type Provider = "anthropic" | "openai" | "google" | "openrouter" | "mock";

function detectProvider(): { provider: Provider; apiKey: string } {
  const anthropic = process.env.ANTHROPIC_API_KEY;
  if (anthropic) return { provider: "anthropic", apiKey: anthropic };

  const openai = process.env.OPENAI_API_KEY;
  if (openai) return { provider: "openai", apiKey: openai };

  const google = process.env.GOOGLE_AI_API_KEY;
  if (google) return { provider: "google", apiKey: google };

  const openrouter = process.env.OPENROUTER_API_KEY;
  if (openrouter) return { provider: "openrouter", apiKey: openrouter };

  return { provider: "mock", apiKey: "" };
}

async function analyzeWithAnthropic(content: string, contentType: string, apiKey: string): Promise<AnalysisResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Content type: ${contentType}\n\n${content}` },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Anthropic API error:", response.status, err);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content[0].text;
  return parseAIResponse(raw);
}

async function analyzeWithOpenAI(content: string, contentType: string, apiKey: string): Promise<AnalysisResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Content type: ${contentType}\n\n${content}` },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenAI API error:", response.status, err);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return parseAIResponse(data.choices[0].message.content);
}

async function analyzeWithGoogle(content: string, contentType: string, apiKey: string): Promise<AnalysisResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          { role: "user", parts: [{ text: `Content type: ${contentType}\n\n${content}` }] },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Google AI error:", response.status, err);
    throw new Error(`Google AI error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.candidates[0].content.parts[0].text;
  return parseAIResponse(raw);
}

async function analyzeWithOpenRouter(content: string, contentType: string, apiKey: string): Promise<AnalysisResult> {
  // OpenRouter supports many models including free ones
  // Free tier: google/gemma-3-1b-it:free, meta-llama/llama-3.2-3b-instruct:free
  // Paid tier: uses whatever model is configured
  const model = process.env.OPENROUTER_MODEL || "google/gemma-3-12b-it:free";
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://contentlens.app",
      "X-Title": "ContentLens",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Content type: ${contentType}\n\n${content}` },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenRouter API error:", response.status, err);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return parseAIResponse(data.choices[0].message.content);
}

export async function analyzeContent(content: string, type: string): Promise<{ result: AnalysisResult; provider: Provider }> {
  const { provider, apiKey } = detectProvider();
  const contentType = type === "tweet" ? "X/Twitter post" : "Substack article";

  if (provider === "mock") {
    return { result: getMockAnalysis(content, type), provider: "mock" };
  }

  try {
    let result: AnalysisResult;
    switch (provider) {
      case "anthropic":
        result = await analyzeWithAnthropic(content, contentType, apiKey);
        break;
      case "openai":
        result = await analyzeWithOpenAI(content, contentType, apiKey);
        break;
      case "google":
        result = await analyzeWithGoogle(content, contentType, apiKey);
        break;
      case "openrouter":
        result = await analyzeWithOpenRouter(content, contentType, apiKey);
        break;
    }
    return { result, provider };
  } catch (err) {
    console.error(`${provider} failed, falling back to mock:`, err);
    return { result: getMockAnalysis(content, type), provider: "mock" };
  }
}

export function getMockAnalysis(content: string, type: string): AnalysisResult {
  return runSmartAnalysis(content, type);
}

