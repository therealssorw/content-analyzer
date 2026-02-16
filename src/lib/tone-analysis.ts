/**
 * Tone & Voice Analysis — local computation, no API needed.
 * Detects writing voice, formality, confidence, and personality traits.
 */

export interface ToneResult {
  formality: { level: "casual" | "conversational" | "professional" | "academic"; score: number };
  confidence: { level: "tentative" | "balanced" | "assertive" | "authoritative"; score: number };
  voice: string; // e.g., "Witty Educator", "Passionate Advocate"
  personality: string[]; // e.g., ["authentic", "provocative", "data-driven"]
  suggestions: string[];
}

// Hedging language (reduces confidence)
const HEDGE_WORDS = /\b(maybe|perhaps|might|could|possibly|somewhat|sort of|kind of|a bit|a little|I think|I guess|I feel like|probably|seems like|tends to|appears to)\b/gi;

// Assertive language (increases confidence)
const ASSERTIVE_WORDS = /\b(always|never|must|definitely|absolutely|clearly|obviously|undeniably|without doubt|the truth is|the fact is|here's the thing|let me be clear|period|full stop)\b/gi;

// Casual markers
const CASUAL_MARKERS = /\b(lol|lmao|tbh|ngl|fr|bruh|dude|bro|gonna|wanna|gotta|kinda|y'all|omg|btw|imo|imho|haha|damn|hell|crap|shit|wtf|af)\b|\.{3}|!{2,}|\?{2,}/gi;

// Formal markers
const FORMAL_MARKERS = /\b(furthermore|moreover|consequently|nevertheless|notwithstanding|henceforth|whereas|thereby|thus|hence|accordingly|in conclusion|it is worth noting|one might argue)\b/gi;

// Conversational markers
const CONVERSATIONAL_MARKERS = /\b(look|listen|here's the thing|let me tell you|you know what|right\?|okay so|so here's|the thing is|real talk|honestly|between you and me)\b/gi;

// Personality trait patterns
const PERSONALITY_PATTERNS: Array<{ pattern: RegExp; trait: string }> = [
  { pattern: /\b(data|research|study|evidence|statistic|percent|\d+%|analysis|metric)\b/gi, trait: "data-driven" },
  { pattern: /\b(story|once upon|I remember|years ago|when I was|let me share|true story)\b/gi, trait: "storyteller" },
  { pattern: /\b(actually|wrong|myth|contrary|unpopular opinion|hot take|controversial)\b/gi, trait: "provocative" },
  { pattern: /\b(honest|vulnerable|admit|confess|embarrass|mistake|I failed|I struggled|truth is)\b/gi, trait: "authentic" },
  { pattern: /\b(step \d|first|second|third|framework|system|process|method|strategy|blueprint)\b/gi, trait: "systematic" },
  { pattern: /\b(funny|hilarious|joke|laugh|comedy|ridiculous|absurd|ironic|sarcas)/gi, trait: "witty" },
  { pattern: /\b(inspire|dream|vision|believe|passion|purpose|mission|impact|change the world)\b/gi, trait: "inspirational" },
  { pattern: /\b(practical|actionable|concrete|specific|exactly how|here's how|do this|try this)\b/gi, trait: "practical" },
];

// Voice archetype combos
const VOICE_ARCHETYPES: Array<{ traits: string[]; voice: string }> = [
  { traits: ["data-driven", "systematic"], voice: "Strategic Analyst" },
  { traits: ["storyteller", "authentic"], voice: "Vulnerable Narrator" },
  { traits: ["provocative", "witty"], voice: "Sharp Contrarian" },
  { traits: ["inspirational", "authentic"], voice: "Passionate Advocate" },
  { traits: ["practical", "systematic"], voice: "Tactical Guide" },
  { traits: ["witty", "practical"], voice: "Witty Educator" },
  { traits: ["data-driven", "provocative"], voice: "Myth Buster" },
  { traits: ["storyteller", "inspirational"], voice: "Visionary Storyteller" },
  { traits: ["authentic", "practical"], voice: "Real Talk Coach" },
  { traits: ["provocative", "systematic"], voice: "Framework Breaker" },
];

export function analyzeTone(content: string): ToneResult {
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  if (wordCount === 0) {
    return {
      formality: { level: "conversational", score: 50 },
      confidence: { level: "balanced", score: 50 },
      voice: "Unknown",
      personality: [],
      suggestions: ["Add some content to analyze your tone."],
    };
  }

  // --- Formality ---
  const casualMatches = (content.match(CASUAL_MARKERS) || []).length;
  const formalMatches = (content.match(FORMAL_MARKERS) || []).length;
  const conversationalMatches = (content.match(CONVERSATIONAL_MARKERS) || []).length;

  let formalityScore = 50;
  formalityScore -= casualMatches * 6;
  formalityScore += formalMatches * 8;
  formalityScore -= conversationalMatches * 3;

  // Sentence length affects formality
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const avgSentenceLen = sentences.length > 0 ? words.length / sentences.length : 10;
  if (avgSentenceLen > 25) formalityScore += 10;
  if (avgSentenceLen < 10) formalityScore -= 8;

  // Contractions = casual
  const contractions = (content.match(/\w+'\w+/g) || []).length;
  formalityScore -= contractions * 2;

  formalityScore = Math.max(0, Math.min(100, formalityScore));

  let formalityLevel: ToneResult["formality"]["level"];
  if (formalityScore < 25) formalityLevel = "casual";
  else if (formalityScore < 50) formalityLevel = "conversational";
  else if (formalityScore < 75) formalityLevel = "professional";
  else formalityLevel = "academic";

  // --- Confidence ---
  const hedgeMatches = (content.match(HEDGE_WORDS) || []).length;
  const assertiveMatches = (content.match(ASSERTIVE_WORDS) || []).length;

  let confidenceScore = 50;
  confidenceScore -= hedgeMatches * 5;
  confidenceScore += assertiveMatches * 6;

  // Exclamation marks boost confidence slightly
  const exclamations = (content.match(/!/g) || []).length;
  confidenceScore += Math.min(exclamations * 2, 10);

  // Questions reduce assertiveness (but that's okay for engagement)
  const questions = (content.match(/\?/g) || []).length;
  confidenceScore -= questions * 1;

  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  let confidenceLevel: ToneResult["confidence"]["level"];
  if (confidenceScore < 30) confidenceLevel = "tentative";
  else if (confidenceScore < 55) confidenceLevel = "balanced";
  else if (confidenceScore < 80) confidenceLevel = "assertive";
  else confidenceLevel = "authoritative";

  // --- Personality Traits ---
  const detectedTraits: string[] = [];
  for (const { pattern, trait } of PERSONALITY_PATTERNS) {
    const matches = content.match(new RegExp(pattern.source, "gi"));
    if (matches && matches.length >= 1) {
      detectedTraits.push(trait);
    }
  }
  const uniqueTraits = [...new Set(detectedTraits)];

  // --- Voice Archetype ---
  let voice = "Balanced Writer";
  let bestMatch = 0;
  for (const archetype of VOICE_ARCHETYPES) {
    const matchCount = archetype.traits.filter(t => uniqueTraits.includes(t)).length;
    if (matchCount > bestMatch) {
      bestMatch = matchCount;
      voice = archetype.voice;
    }
  }
  // If only one trait, use a simpler voice label
  if (uniqueTraits.length === 1) {
    const traitToVoice: Record<string, string> = {
      "data-driven": "Data-Driven Writer",
      "storyteller": "Natural Storyteller",
      "provocative": "Bold Contrarian",
      "authentic": "Authentic Voice",
      "systematic": "Systems Thinker",
      "witty": "Sharp Wit",
      "inspirational": "Inspirational Writer",
      "practical": "Tactical Writer",
    };
    voice = traitToVoice[uniqueTraits[0]] || voice;
  }

  // --- Suggestions ---
  const suggestions: string[] = [];

  if (confidenceLevel === "tentative") {
    suggestions.push("Cut hedging language ('maybe', 'I think', 'sort of') — strong opinions attract followers.");
  }
  if (formalityLevel === "academic") {
    suggestions.push("Loosen up. Replace formal words with conversational ones — 'furthermore' → 'and here's the thing'.");
  }
  if (uniqueTraits.length < 2) {
    suggestions.push("Your voice lacks distinctiveness. Try mixing personality traits — add stories to data, or humor to frameworks.");
  }
  if (!uniqueTraits.includes("authentic") && !uniqueTraits.includes("storyteller")) {
    suggestions.push("Add a personal element. Audiences connect with people, not textbooks.");
  }
  if (hedgeMatches > 3 && assertiveMatches < 2) {
    suggestions.push("You're hedging too much. Pick a side and commit. 'This might help' → 'This will change how you write.'");
  }
  if (formalityLevel === "casual" && uniqueTraits.includes("data-driven")) {
    suggestions.push("Great combo — casual tone + data gives you authority without stiffness. Lean into it.");
  }

  return {
    formality: { level: formalityLevel, score: formalityScore },
    confidence: { level: confidenceLevel, score: confidenceScore },
    voice,
    personality: uniqueTraits.slice(0, 5),
    suggestions: suggestions.slice(0, 3),
  };
}
