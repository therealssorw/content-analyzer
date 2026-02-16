import { NextRequest, NextResponse } from "next/server";

const REWRITE_PROMPT = `You are an expert content strategist specializing in viral hooks and attention-grabbing openers.

Given the original content and its analysis, rewrite ONLY the hook (first 1-3 sentences) to be dramatically more compelling. 

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "rewrites": [
    {
      "style": "<style name, e.g. Curiosity Gap, Bold Claim, Story Hook>",
      "hook": "<the rewritten hook, 1-3 sentences>",
      "why": "<1 sentence explaining why this works better>"
    }
  ]
}

Generate exactly 3 rewrites, each using a different psychological hook style.
Be specific to the content. Don't be generic. Match the author's voice but amplify it.`;

function detectProvider(): { provider: string; apiKey: string } {
  if (process.env.ANTHROPIC_API_KEY) return { provider: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY };
  if (process.env.OPENAI_API_KEY) return { provider: "openai", apiKey: process.env.OPENAI_API_KEY };
  if (process.env.GOOGLE_AI_API_KEY) return { provider: "google", apiKey: process.env.GOOGLE_AI_API_KEY };
  return { provider: "mock", apiKey: "" };
}

function getMockRewrites(content: string) {
  const firstLine = content.split(/[.\n]/)[0]?.trim() || content.slice(0, 50);
  return {
    rewrites: [
      {
        style: "Curiosity Gap",
        hook: `Most people get this wrong about ${firstLine.toLowerCase().slice(0, 30)}... and it's costing them everything.`,
        why: "Opens a knowledge gap the reader can't resist closing."
      },
      {
        style: "Bold Contrarian",
        hook: `Unpopular opinion: everything you've been told about ${firstLine.toLowerCase().slice(0, 25)} is backwards.`,
        why: "Contrarian takes trigger disagreement, which drives engagement."
      },
      {
        style: "Story Hook",
        hook: `Last week I almost gave up. Then I discovered something about ${firstLine.toLowerCase().slice(0, 25)} that changed everything.`,
        why: "Personal vulnerability + transformation arc creates emotional investment."
      }
    ]
  };
}

export async function POST(req: NextRequest) {
  try {
    const { content, type, analysis } = await req.json();
    if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const { provider, apiKey } = detectProvider();
    const contentType = type === "tweet" ? "X/Twitter post" : "Substack article";

    if (provider === "mock") {
      return NextResponse.json({ ...getMockRewrites(content), mock: true });
    }

    const userMessage = `Content type: ${contentType}
Hook score: ${analysis?.hookStrength?.score || "unknown"}/100
Hook feedback: ${analysis?.hookStrength?.feedback || "none"}

Original content:
${content}`;

    let raw: string;
    try {
      if (provider === "anthropic") {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 512, system: REWRITE_PROMPT, messages: [{ role: "user", content: userMessage }] }),
        });
        if (!res.ok) throw new Error(`Anthropic ${res.status}`);
        const data = await res.json();
        raw = data.content[0].text;
      } else if (provider === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "system", content: REWRITE_PROMPT }, { role: "user", content: userMessage }], temperature: 0.8, max_tokens: 512 }),
        });
        if (!res.ok) throw new Error(`OpenAI ${res.status}`);
        const data = await res.json();
        raw = data.choices[0].message.content;
      } else {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: REWRITE_PROMPT }] }, contents: [{ role: "user", parts: [{ text: userMessage }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 512 } }),
        });
        if (!res.ok) throw new Error(`Google ${res.status}`);
        const data = await res.json();
        raw = data.candidates[0].content.parts[0].text;
      }

      const cleaned = raw.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(cleaned);
      return NextResponse.json(result);
    } catch (err) {
      console.error("Rewrite AI failed, falling back to mock:", err);
      return NextResponse.json({ ...getMockRewrites(content), mock: true });
    }
  } catch {
    return NextResponse.json({ error: "Rewrite failed" }, { status: 500 });
  }
}
