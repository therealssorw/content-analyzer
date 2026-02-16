/**
 * Multi-provider AI analysis engine.
 * Supports: Anthropic Claude, OpenAI GPT, Google Gemini
 * Falls back to mock if no API key is configured.
 * 
 * Priority: ANTHROPIC_API_KEY > OPENAI_API_KEY > GOOGLE_AI_API_KEY > mock
 */

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

type Provider = "anthropic" | "openai" | "google" | "mock";

function detectProvider(): { provider: Provider; apiKey: string } {
  const anthropic = process.env.ANTHROPIC_API_KEY;
  if (anthropic) return { provider: "anthropic", apiKey: anthropic };

  const openai = process.env.OPENAI_API_KEY;
  if (openai) return { provider: "openai", apiKey: openai };

  const google = process.env.GOOGLE_AI_API_KEY;
  if (google) return { provider: "google", apiKey: google };

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
    }
    return { result, provider };
  } catch (err) {
    console.error(`${provider} failed, falling back to mock:`, err);
    return { result: getMockAnalysis(content, type), provider: "mock" };
  }
}

export function getMockAnalysis(content: string, type: string): AnalysisResult {
  const len = content.length;
  const hasQuestion = content.includes("?");
  const hasNumbers = /\d/.test(content);
  const hasEmoji = /[\u{1F600}-\u{1F9FF}]/u.test(content);
  const baseScore = Math.min(95, Math.max(35, 50 + (len > 100 ? 10 : 0) + (hasQuestion ? 8 : 0) + (hasNumbers ? 7 : 0) + (hasEmoji ? 5 : 0)));

  if (type === "tweet") {
    return {
      overallScore: baseScore,
      hookStrength: {
        score: Math.min(100, baseScore + 5),
        feedback: hasQuestion
          ? "Strong opening — leading with a question creates instant curiosity. The reader's brain can't help but try to answer it."
          : "Your hook is decent but could hit harder. Try opening with a bold claim, a surprising stat, or a direct question to stop the scroll.",
      },
      structure: {
        score: Math.min(100, baseScore - 3),
        feedback: len > 200
          ? "Good use of length for a thread-style post. Consider adding line breaks every 1-2 sentences for better scannability on mobile."
          : "Concise and punchy — perfect for the timeline. Each word earns its place.",
      },
      emotionalTriggers: {
        score: Math.min(100, baseScore + 2),
        feedback: "You're tapping into curiosity and authority. To boost engagement, add a contrarian angle or personal vulnerability — those drive replies.",
        triggers: ["Curiosity", "Authority", hasQuestion ? "Open Loop" : "Statement of Belief"],
      },
      improvements: [
        "Add a specific number or data point to increase credibility",
        "End with a clear CTA — ask a question or invite disagreement",
        "Consider breaking into a thread if you have supporting points",
        len < 100 ? "You have room to add more context without losing punch" : "Trim any filler words to tighten the message",
      ],
      summary: "This post has solid bones. The voice is clear and the point lands. With a stronger hook and a conversation-starting CTA, this could easily 2-3x its engagement.",
    };
  }

  return {
    overallScore: baseScore,
    hookStrength: {
      score: Math.min(100, baseScore + 3),
      feedback: "Your headline needs to promise a transformation or reveal. Top Substack writers use specificity — instead of 'How to Write Better', try 'The 3-Sentence Framework That Doubled My Open Rate'.",
    },
    structure: {
      score: Math.min(100, baseScore - 5),
      feedback: "The piece flows reasonably well but could benefit from more subheadings and shorter paragraphs. Readers scan before they commit — give them clear signposts.",
    },
    emotionalTriggers: {
      score: Math.min(100, baseScore + 1),
      feedback: "You're building trust through expertise, but the emotional core is buried. Lead with the feeling, then back it with logic.",
      triggers: ["Trust", "Expertise", "Aspiration", hasQuestion ? "Curiosity" : "Belonging"],
    },
    improvements: [
      "Open with a story or vivid scene — not a thesis statement",
      "Add 2-3 subheadings that work as standalone hooks",
      "Include a 'what this means for you' section to make it personal",
      "Your closing should loop back to the opening — create narrative closure",
      "Add a P.S. with a question to drive comments",
    ],
    summary: "This article has genuine insight but buries the lead. Restructuring the first 3 paragraphs to hook emotionally before going analytical could significantly boost read-through rate and shares.",
  };
}
