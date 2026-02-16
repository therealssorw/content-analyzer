/**
 * Local readability analysis — no AI needed.
 * Computes Flesch Reading Ease, sentence stats, and actionable suggestions.
 */

export interface ReadabilityScore {
  fleschReadingEase: number;
  gradeLevel: string;
  avgSentenceLength: number;
  avgWordLength: number;
  sentenceCount: number;
  wordCount: number;
  paragraphCount: number;
  longSentences: number;
  passiveVoiceEstimate: number;
  readingTimeSeconds: number;
  suggestions: string[];
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 2) return 1;
  
  // Remove silent e
  word = word.replace(/e$/, "");
  
  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g);
  const count = vowelGroups ? vowelGroups.length : 1;
  
  return Math.max(1, count);
}

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function splitWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z'-]/g, ""))
    .filter(w => w.length > 0);
}

const PASSIVE_PATTERNS = [
  /\b(was|were|is|are|been|being|be)\s+\w+ed\b/gi,
  /\b(was|were|is|are|been|being|be)\s+\w+en\b/gi,
  /\b(got|get|gets|getting)\s+\w+ed\b/gi,
];

export function analyzeReadability(text: string): ReadabilityScore {
  const sentences = splitSentences(text);
  const words = splitWords(text);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const sentenceCount = Math.max(1, sentences.length);
  const wordCount = Math.max(1, words.length);
  const paragraphCount = Math.max(1, paragraphs.length);

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSentenceLength = wordCount / sentenceCount;
  const avgSyllablesPerWord = totalSyllables / wordCount;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;

  // Flesch Reading Ease: 206.835 - 1.015 * ASL - 84.6 * ASW
  const fleschReadingEase = Math.max(0, Math.min(100,
    Math.round(206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord)
  ));

  // Long sentences (>25 words)
  const longSentences = sentences.filter(s => splitWords(s).length > 25).length;

  // Passive voice estimate
  let passiveCount = 0;
  for (const pattern of PASSIVE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) passiveCount += matches.length;
  }
  const passiveVoiceEstimate = Math.round((passiveCount / sentenceCount) * 100);

  // Grade level
  let gradeLevel: string;
  if (fleschReadingEase >= 90) gradeLevel = "5th Grade — Very Easy";
  else if (fleschReadingEase >= 80) gradeLevel = "6th Grade — Easy";
  else if (fleschReadingEase >= 70) gradeLevel = "7th Grade — Fairly Easy";
  else if (fleschReadingEase >= 60) gradeLevel = "8th-9th Grade — Standard";
  else if (fleschReadingEase >= 50) gradeLevel = "10th-12th Grade — Fairly Hard";
  else if (fleschReadingEase >= 30) gradeLevel = "College — Hard";
  else gradeLevel = "Graduate — Very Hard";

  // Reading time (avg 238 words/min)
  const readingTimeSeconds = Math.round((wordCount / 238) * 60);

  // Generate suggestions
  const suggestions: string[] = [];

  if (fleschReadingEase < 50) {
    suggestions.push("Your writing is quite dense. Try shorter sentences and simpler words for better engagement.");
  }
  if (avgSentenceLength > 20) {
    suggestions.push(`Average sentence length is ${Math.round(avgSentenceLength)} words. Aim for 15-20 for online content.`);
  }
  if (longSentences > 0) {
    suggestions.push(`${longSentences} sentence${longSentences > 1 ? "s" : ""} over 25 words. Break these up for better flow.`);
  }
  if (passiveVoiceEstimate > 20) {
    suggestions.push(`~${passiveVoiceEstimate}% passive voice detected. Use active voice for punchier writing.`);
  }
  if (paragraphCount > 0 && wordCount / paragraphCount > 100) {
    suggestions.push("Paragraphs are long. Online readers prefer 2-3 sentence paragraphs max.");
  }
  if (wordCount < 50 && avgSentenceLength < 8) {
    suggestions.push("Very short and punchy — great for social. Make sure every word earns its place.");
  }

  return {
    fleschReadingEase,
    gradeLevel,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    sentenceCount,
    wordCount,
    paragraphCount,
    longSentences,
    passiveVoiceEstimate,
    readingTimeSeconds,
    suggestions,
  };
}
