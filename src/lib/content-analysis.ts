/**
 * Local content analysis engine — computed heuristics, no API key needed.
 * Provides real, data-driven analysis of hooks, structure, and emotional triggers.
 */

// ---- Hook Analysis ----

interface HookAnalysis {
  score: number;
  feedback: string;
  techniques: string[];
}

const POWER_WORDS = new Set([
  "secret", "shocking", "surprising", "revealed", "truth", "mistake",
  "proven", "guaranteed", "discover", "warning", "urgent", "breaking",
  "exclusive", "insider", "hidden", "banned", "controversial", "dangerous",
  "extraordinary", "incredible", "unbelievable", "remarkable", "stunning",
  "devastating", "brilliant", "genius", "powerful", "deadly", "critical",
  "essential", "ultimate", "definitive", "complete", "massive", "tiny",
  "silent", "forgotten", "unknown", "rare", "strange", "weird",
]);

const CURIOSITY_PATTERNS = [
  { pattern: /^(what|why|how|when|where|who)\s/i, technique: "Question Hook" },
  { pattern: /\b\d+\s+(ways?|tips?|steps?|reasons?|things?|mistakes?|habits?|rules?|secrets?|lessons?|signs?|examples?)\b/i, technique: "Listicle Hook" },
  { pattern: /^(I|we|my)\s/i, technique: "Personal Story Hook" },
  { pattern: /^(most|everyone|nobody|no one|people)\s/i, technique: "Universal Statement" },
  { pattern: /\b(but|however|yet|actually|instead|except)\b/i, technique: "Contrarian Twist" },
  { pattern: /\b(don'?t|stop|never|avoid|quit)\b/i, technique: "Negative Framing" },
  { pattern: /\b(imagine|picture|think about|what if)\b/i, technique: "Visualization" },
  { pattern: /\b(you|your|you're|you'll)\b/i, technique: "Direct Address" },
  { pattern: /\b(just|simply|only|exactly)\b/i, technique: "Simplicity Promise" },
  { pattern: /\b(finally|at last)\b/i, technique: "Resolution Hook" },
];

export function analyzeHook(content: string, type: string): HookAnalysis {
  const lines = content.split(/\n/).filter(l => l.trim());
  const hook = lines[0] || "";
  const hookWords = hook.toLowerCase().split(/\s+/);
  const hookLength = hookWords.length;

  let score = 50;
  const techniques: string[] = [];
  const feedbackParts: string[] = [];

  // Check for hook techniques
  for (const { pattern, technique } of CURIOSITY_PATTERNS) {
    if (pattern.test(hook)) {
      techniques.push(technique);
      score += 5;
    }
  }

  // Power words
  const powerWordsFound = hookWords.filter(w => POWER_WORDS.has(w.replace(/[^a-z]/g, "")));
  if (powerWordsFound.length > 0) {
    techniques.push("Power Words");
    score += powerWordsFound.length * 4;
  }

  // Question mark — creates open loop
  if (hook.includes("?")) {
    score += 6;
    if (!techniques.includes("Question Hook")) techniques.push("Open Loop");
  }

  // Hook length optimization
  if (type === "tweet") {
    if (hookLength >= 5 && hookLength <= 15) {
      score += 5;
    } else if (hookLength > 25) {
      score -= 5;
      feedbackParts.push("Your hook is long — consider cutting to under 15 words for maximum scroll-stop power.");
    }
  } else {
    if (hookLength >= 5 && hookLength <= 20) {
      score += 5;
    } else if (hookLength > 30) {
      score -= 5;
      feedbackParts.push("Long headlines lose attention. Aim for 6-12 words that promise a specific transformation.");
    }
  }

  // Starts with a number
  if (/^\d/.test(hook)) {
    techniques.push("Numeric Lead");
    score += 6;
  }

  // Colon or dash (subtitle pattern)
  if (/[:\u2014—–-]\s/.test(hook)) {
    techniques.push("Subtitle Pattern");
    score += 3;
  }

  // Emoji in hook
  if (/[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(hook)) {
    if (type === "tweet") {
      score += 3;
      techniques.push("Emoji Hook");
    }
  }

  // Build feedback
  if (techniques.length === 0) {
    feedbackParts.unshift(`Your opening "${hook.slice(0, 60)}${hook.length > 60 ? "..." : ""}" is straightforward but doesn't use any proven hook techniques. Try leading with a question, a bold number, or a contrarian claim.`);
  } else if (techniques.length >= 3) {
    feedbackParts.unshift(`Strong hook using ${techniques.slice(0, 3).join(", ")}. "${hook.slice(0, 50)}${hook.length > 50 ? "..." : ""}" hits multiple psychological triggers that stop the scroll.`);
  } else {
    feedbackParts.unshift(`Your hook uses ${techniques.join(" + ")} — solid technique. To strengthen it, try adding a specific number or contrarian angle.`);
  }

  return {
    score: Math.max(15, Math.min(98, score)),
    feedback: feedbackParts.join(" "),
    techniques,
  };
}

// ---- Structure Analysis ----

interface StructureAnalysis {
  score: number;
  feedback: string;
}

export function analyzeStructure(content: string, type: string): StructureAnalysis {
  const lines = content.split(/\n/);
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const words = content.split(/\s+/).filter(w => w.length > 0);

  let score = 50;
  const feedbackParts: string[] = [];

  if (type === "tweet") {
    // Tweet structure
    const hasLineBreaks = lines.filter(l => l.trim()).length > 1;
    if (hasLineBreaks) {
      score += 10;
      feedbackParts.push("Good use of line breaks for scannability.");
    }

    if (words.length <= 50) {
      score += 5;
      feedbackParts.push("Concise and punchy.");
    } else if (words.length > 100) {
      score -= 5;
      feedbackParts.push("Consider trimming — shorter posts tend to get more engagement.");
    }

    // Check for CTA at end
    const lastLine = lines.filter(l => l.trim()).pop() || "";
    if (/\?|comment|reply|share|repost|follow|tag|agree|disagree|thoughts/i.test(lastLine)) {
      score += 8;
      feedbackParts.push("Strong CTA at the end drives engagement.");
    } else {
      feedbackParts.push("Add a CTA at the end — a question or invitation to respond boosts replies.");
    }
  } else {
    // Article structure
    const headings = lines.filter(l => /^#{1,3}\s|^[A-Z][A-Z\s]{5,}$/.test(l.trim()));
    const bulletLists = lines.filter(l => /^\s*[-*•]\s/.test(l));
    const avgParaLength = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / Math.max(paragraphs.length, 1);

    if (headings.length >= 2) {
      score += 10;
      feedbackParts.push(`${headings.length} subheadings provide clear structure.`);
    } else if (words.length > 200) {
      score -= 8;
      feedbackParts.push("Add subheadings — readers scan before they commit. Break content into clear sections.");
    }

    if (bulletLists.length >= 2) {
      score += 5;
      feedbackParts.push("Bullet points aid scannability.");
    }

    if (avgParaLength > 60) {
      score -= 8;
      feedbackParts.push("Paragraphs are too dense. Aim for 2-4 sentences per paragraph for online reading.");
    } else if (avgParaLength <= 40) {
      score += 5;
      feedbackParts.push("Good paragraph length for online reading.");
    }

    // Check for conclusion / closing
    const lastPara = paragraphs[paragraphs.length - 1] || "";
    if (/\?|subscribe|follow|share|leave a comment|let me know|what do you think/i.test(lastPara)) {
      score += 5;
      feedbackParts.push("Ending with engagement prompt is smart.");
    }
  }

  return {
    score: Math.max(15, Math.min(98, score)),
    feedback: feedbackParts.join(" ") || "Structure is adequate but could be improved with clearer sections and formatting.",
  };
}

// ---- Emotional Trigger Detection ----

interface EmotionalAnalysis {
  score: number;
  feedback: string;
  triggers: string[];
}

const EMOTION_PATTERNS: Array<{ pattern: RegExp; trigger: string; weight: number }> = [
  { pattern: /\b(secret|hidden|reveal|discover|uncover)\b/i, trigger: "Curiosity", weight: 8 },
  { pattern: /\b(miss out|left behind|too late|last chance|hurry|limited)\b/i, trigger: "FOMO", weight: 7 },
  { pattern: /\b(I|me|my|we|our)\b/i, trigger: "Personal Connection", weight: 4 },
  { pattern: /\b(you|your|you're)\b/i, trigger: "Direct Address", weight: 5 },
  { pattern: /\b(data|research|study|proven|evidence|statistic|percent|\d+%)\b/i, trigger: "Authority", weight: 6 },
  { pattern: /\b(everyone|most people|they all|nobody|no one)\b/i, trigger: "Social Proof", weight: 5 },
  { pattern: /\b(wrong|myth|lie|actually|truth is|contrary)\b/i, trigger: "Contrarian", weight: 7 },
  { pattern: /\b(struggle|fail|pain|fear|worry|stress|anxiety|overwhelm)\b/i, trigger: "Pain Point", weight: 6 },
  { pattern: /\b(dream|achieve|success|grow|transform|unlock|freedom|wealth)\b/i, trigger: "Aspiration", weight: 6 },
  { pattern: /\b(honest|vulnerable|admit|confess|embarrass|mistake|failure)\b/i, trigger: "Vulnerability", weight: 8 },
  { pattern: /\b(now|today|immediately|right now|this week)\b/i, trigger: "Urgency", weight: 5 },
  { pattern: /\b(free|save|cheap|cost|expensive|worth|value|price)\b/i, trigger: "Value Framing", weight: 4 },
  { pattern: /\b(story|once|remember|years ago|when I was)\b/i, trigger: "Storytelling", weight: 7 },
  { pattern: /\b(simple|easy|quick|fast|just|only)\b/i, trigger: "Simplicity", weight: 4 },
];

export function analyzeEmotions(content: string): EmotionalAnalysis {
  const triggers: string[] = [];
  let score = 40;

  for (const { pattern, trigger, weight } of EMOTION_PATTERNS) {
    const matches = content.match(new RegExp(pattern.source, "gi"));
    if (matches && matches.length > 0) {
      triggers.push(trigger);
      score += weight;
    }
  }

  // Dedupe
  const uniqueTriggers = [...new Set(triggers)];

  const feedbackParts: string[] = [];
  if (uniqueTriggers.length >= 5) {
    feedbackParts.push(`Rich emotional landscape — you're hitting ${uniqueTriggers.length} psychological triggers. This content has high engagement potential.`);
  } else if (uniqueTriggers.length >= 3) {
    feedbackParts.push(`Solid emotional foundation with ${uniqueTriggers.join(", ")}. Consider adding vulnerability or a contrarian angle to deepen impact.`);
  } else if (uniqueTriggers.length >= 1) {
    feedbackParts.push(`Limited emotional range — only tapping ${uniqueTriggers.join(", ")}. High-performing content typically leverages 3-5 triggers.`);
  } else {
    feedbackParts.push("No strong emotional triggers detected. This reads as informational rather than engaging. Add personal stories, pain points, or aspirational language.");
  }

  return {
    score: Math.max(15, Math.min(98, score)),
    feedback: feedbackParts.join(" "),
    triggers: uniqueTriggers.slice(0, 6),
  };
}

// ---- Combined Smart Analysis (replaces generic mock) ----

export interface SmartAnalysisResult {
  overallScore: number;
  hookStrength: { score: number; feedback: string };
  structure: { score: number; feedback: string };
  emotionalTriggers: { score: number; feedback: string; triggers: string[] };
  improvements: string[];
  summary: string;
}

export function runSmartAnalysis(content: string, type: string): SmartAnalysisResult {
  const hook = analyzeHook(content, type);
  const structure = analyzeStructure(content, type);
  const emotions = analyzeEmotions(content);

  const overallScore = Math.round(hook.score * 0.35 + structure.score * 0.3 + emotions.score * 0.35);

  // Generate specific improvements based on analysis
  const improvements: string[] = [];

  if (hook.techniques.length < 2) {
    improvements.push("Strengthen your hook — try opening with a specific number, bold question, or contrarian claim to stop the scroll.");
  }
  if (!content.includes("?")) {
    improvements.push("Add at least one question — questions create open loops that keep readers engaged.");
  }
  if (emotions.triggers.length < 3) {
    improvements.push("Layer in more emotional triggers — combine curiosity with vulnerability or authority with aspiration.");
  }
  if (type === "article" && content.split(/\n\s*\n/).length < 4) {
    improvements.push("Break your content into more paragraphs — dense blocks of text lose online readers fast.");
  }
  if (type === "tweet" && !/\?|comment|reply|share|thoughts/i.test(content.slice(-100))) {
    improvements.push("End with a clear CTA — ask a question or invite disagreement to drive replies.");
  }
  if (!/\b\d/.test(content)) {
    improvements.push("Add specific numbers or data — '3x more engagement' hits harder than 'much more engagement'.");
  }
  if (!emotions.triggers.includes("Personal Connection") && !emotions.triggers.includes("Vulnerability")) {
    improvements.push("Add a personal angle — 'I struggled with this too' makes content relatable and shareable.");
  }

  // Summary
  const strengths: string[] = [];
  if (hook.score >= 70) strengths.push("strong hook");
  if (structure.score >= 70) strengths.push("clean structure");
  if (emotions.score >= 70) strengths.push("emotional depth");

  const weaknesses: string[] = [];
  if (hook.score < 50) weaknesses.push("weak opening");
  if (structure.score < 50) weaknesses.push("structural issues");
  if (emotions.score < 50) weaknesses.push("flat emotional tone");

  let summary: string;
  if (overallScore >= 75) {
    summary = `Strong content overall${strengths.length ? " with " + strengths.join(" and ") : ""}. ${weaknesses.length ? "Main area to improve: " + weaknesses[0] + "." : "Fine-tune the details and this is ready to perform."} ${improvements[0] || ""}`;
  } else if (overallScore >= 50) {
    summary = `Decent foundation but needs work. ${strengths.length ? "You've got " + strengths.join(" and ") + ", but " : ""}${weaknesses.length ? weaknesses.join(" and ") + " are holding this back." : "several areas need refinement."} Focus on the top improvement first.`;
  } else {
    summary = `This needs significant revision. ${weaknesses.join(", ")} are the core issues. Start by rewriting the hook — if you don't stop the scroll, nothing else matters.`;
  }

  return {
    overallScore: Math.max(15, Math.min(98, overallScore)),
    hookStrength: { score: hook.score, feedback: hook.feedback },
    structure: { score: structure.score, feedback: structure.feedback },
    emotionalTriggers: { score: emotions.score, feedback: emotions.feedback, triggers: emotions.triggers },
    improvements: improvements.slice(0, 5),
    summary,
  };
}
