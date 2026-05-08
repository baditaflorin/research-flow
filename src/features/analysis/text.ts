import { stopwords } from "./stopwords";

export interface ClaimSentence {
  sentence: string;
  direction: -1 | 1;
  terms: string[];
}

const positivePatterns = [
  /\bincrease[sd]?\b/i,
  /\bhigher\b/i,
  /\bimprove[sd]?\b/i,
  /\bsupport[sed]?\b/i,
  /\bpositive\b/i,
  /\beffective\b/i,
  /\bsignificant\b/i,
  /\bbenefit[sed]?\b/i
];

const negativePatterns = [
  /\bdecrease[sd]?\b/i,
  /\blower\b/i,
  /\breduce[sd]?\b/i,
  /\bworsen[sed]?\b/i,
  /\bno significant\b/i,
  /\bnot significant\b/i,
  /\bnot associated\b/i,
  /\bno evidence\b/i,
  /\bineffective\b/i,
  /\bnegative\b/i
];

export function tokenize(text: string) {
  return Array.from(text.toLowerCase().matchAll(/[a-z][a-z-]{2,}/g))
    .map((match) => match[0].replace(/-/g, ""))
    .filter((token) => token.length > 2 && !stopwords.has(token));
}

export function topTerms(text: string, limit = 12) {
  const counts = new Map<string, number>();
  for (const token of tokenize(text)) counts.set(token, (counts.get(token) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term]) => term);
}

export function sentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 60 && sentence.length <= 420);
}

export function extractClaimSentences(text: string, keywords: string[]): ClaimSentence[] {
  const keywordSet = new Set(keywords);
  return sentences(text)
    .map((sentence) => {
      const direction = classifyDirection(sentence);
      if (!direction) return undefined;
      const terms = tokenize(sentence).filter((term) => keywordSet.has(term));
      if (terms.length === 0) return undefined;
      return { sentence, direction, terms };
    })
    .filter((claim): claim is ClaimSentence => Boolean(claim))
    .slice(0, 24);
}

function classifyDirection(sentence: string): -1 | 1 | undefined {
  const hasPositive = positivePatterns.some((pattern) => pattern.test(sentence));
  const hasNegative = negativePatterns.some((pattern) => pattern.test(sentence));
  if (hasPositive && !hasNegative) return 1;
  if (hasNegative) return -1;
  return undefined;
}
