export interface DetectionResult {
  /** Total swear words found in the text */
  count: number;
  /** Individual matches */
  matches: Match[];
}

export interface Match {
  word: string;
  index: number;
  severity: Severity;
  group: string;
}

export type Severity = "mild" | "moderate" | "strong";

interface WordDef {
  word: string;
  severity: Severity;
  group: string;
}

/**
 * Core wordlist: canonical forms, conjugations, compound words, and common typos.
 * Grouped by root word for reporting rollup.
 *
 * Sources:
 * - swearjar npm (en_US.json) for compound words
 * - Manual typo variants based on common keyboard transpositions
 */
const WORDLIST: WordDef[] = [
  // === FUCK family (strong) ===
  // Canonical forms
  { word: "fuck", severity: "strong", group: "fuck" },
  { word: "fucking", severity: "strong", group: "fuck" },
  { word: "fucked", severity: "strong", group: "fuck" },
  { word: "fucker", severity: "strong", group: "fuck" },
  { word: "fuckin", severity: "strong", group: "fuck" },
  { word: "fucks", severity: "strong", group: "fuck" },
  // Compound words
  { word: "motherfucker", severity: "strong", group: "fuck" },
  { word: "motherfucking", severity: "strong", group: "fuck" },
  { word: "mothafucka", severity: "strong", group: "fuck" },
  { word: "fuckup", severity: "strong", group: "fuck" },
  { word: "fuckoff", severity: "strong", group: "fuck" },
  { word: "clusterfuck", severity: "strong", group: "fuck" },
  { word: "fuckwit", severity: "strong", group: "fuck" },
  { word: "fucktard", severity: "strong", group: "fuck" },
  { word: "fuckface", severity: "strong", group: "fuck" },
  { word: "fuckhead", severity: "strong", group: "fuck" },
  // Typos — transpositions
  { word: "fukc", severity: "strong", group: "fuck" },
  { word: "fukcing", severity: "strong", group: "fuck" },
  { word: "fukced", severity: "strong", group: "fuck" },
  { word: "fukcer", severity: "strong", group: "fuck" },
  { word: "fcuk", severity: "strong", group: "fuck" },
  { word: "fcuking", severity: "strong", group: "fuck" },
  { word: "fcuked", severity: "strong", group: "fuck" },
  { word: "fuk", severity: "strong", group: "fuck" },
  { word: "fuking", severity: "strong", group: "fuck" },
  { word: "fuked", severity: "strong", group: "fuck" },
  { word: "fuker", severity: "strong", group: "fuck" },
  { word: "fuxk", severity: "strong", group: "fuck" },
  { word: "fuxking", severity: "strong", group: "fuck" },

  // === SHIT family (strong) ===
  { word: "shit", severity: "strong", group: "shit" },
  { word: "shitty", severity: "strong", group: "shit" },
  { word: "shitting", severity: "strong", group: "shit" },
  { word: "shits", severity: "strong", group: "shit" },
  { word: "shitted", severity: "strong", group: "shit" },
  // Compound words
  { word: "bullshit", severity: "strong", group: "shit" },
  { word: "horseshit", severity: "strong", group: "shit" },
  { word: "dipshit", severity: "strong", group: "shit" },
  { word: "shitshow", severity: "strong", group: "shit" },
  { word: "shithead", severity: "strong", group: "shit" },
  { word: "shithole", severity: "strong", group: "shit" },
  { word: "shitface", severity: "strong", group: "shit" },
  { word: "shitfaced", severity: "strong", group: "shit" },
  { word: "shitstain", severity: "strong", group: "shit" },
  { word: "shitbag", severity: "strong", group: "shit" },
  // Typos
  { word: "hsit", severity: "strong", group: "shit" },
  { word: "siht", severity: "strong", group: "shit" },
  { word: "shti", severity: "strong", group: "shit" },
  { word: "sjit", severity: "strong", group: "shit" },
  { word: "shjt", severity: "strong", group: "shit" },
  { word: "bulshit", severity: "strong", group: "shit" },
  { word: "bullsht", severity: "strong", group: "shit" },

  // === ASS family (moderate) ===
  { word: "ass", severity: "moderate", group: "ass" },
  { word: "asses", severity: "moderate", group: "ass" },
  // Compound words (these are strong)
  { word: "asshole", severity: "strong", group: "ass" },
  { word: "assholes", severity: "strong", group: "ass" },
  { word: "jackass", severity: "strong", group: "ass" },
  { word: "dumbass", severity: "strong", group: "ass" },
  { word: "fatass", severity: "moderate", group: "ass" },
  { word: "asshat", severity: "strong", group: "ass" },
  { word: "asswipe", severity: "strong", group: "ass" },
  { word: "badass", severity: "mild", group: "ass" },

  // === DAMN family (moderate) ===
  { word: "damn", severity: "moderate", group: "damn" },
  { word: "damned", severity: "moderate", group: "damn" },
  { word: "damnit", severity: "moderate", group: "damn" },
  { word: "dammit", severity: "moderate", group: "damn" },
  { word: "goddamn", severity: "moderate", group: "damn" },
  { word: "goddamnit", severity: "moderate", group: "damn" },
  { word: "goddammit", severity: "moderate", group: "damn" },

  // === BITCH family (strong) ===
  { word: "bitch", severity: "strong", group: "bitch" },
  { word: "bitches", severity: "strong", group: "bitch" },
  { word: "bitching", severity: "strong", group: "bitch" },
  { word: "bitchy", severity: "strong", group: "bitch" },
  { word: "bitchass", severity: "strong", group: "bitch" },

  // === BASTARD (strong) ===
  { word: "bastard", severity: "strong", group: "bastard" },
  { word: "bastards", severity: "strong", group: "bastard" },

  // === PISS family (moderate) ===
  { word: "piss", severity: "moderate", group: "piss" },
  { word: "pissed", severity: "moderate", group: "piss" },
  { word: "pissing", severity: "moderate", group: "piss" },
  { word: "pissoff", severity: "moderate", group: "piss" },

  // === DICK (moderate) ===
  { word: "dick", severity: "moderate", group: "dick" },
  { word: "dickhead", severity: "strong", group: "dick" },

  // === CRAP (moderate) ===
  { word: "crap", severity: "moderate", group: "crap" },
  { word: "crappy", severity: "moderate", group: "crap" },
  { word: "crapping", severity: "moderate", group: "crap" },

  // === HELL (mild) ===
  { word: "hell", severity: "mild", group: "hell" },

  // === Abbreviations (mild) ===
  { word: "wtf", severity: "mild", group: "wtf" },
  { word: "stfu", severity: "mild", group: "stfu" },
  { word: "lmfao", severity: "mild", group: "lmfao" },
  { word: "lmao", severity: "mild", group: "lmao" },

  // === CUNT (strong) ===
  { word: "cunt", severity: "strong", group: "cunt" },
  { word: "cunts", severity: "strong", group: "cunt" },
];

/**
 * Normalize text before matching:
 * 1. Collapse repeated characters (3+ of the same char → 2)
 *    e.g. "fuuuuck" → "fuuck", "shiiiiit" → "shiit"
 *    This lets "fuuuuck" match against "fuck" after the regex runs,
 *    because the pattern also includes "fuuck" style intermediates.
 *
 * Actually — better approach: collapse ALL runs of 2+ to 1 for matching
 * purposes, while keeping the original text for position tracking.
 * e.g. "fuuuuck" → "fuck", "shiiiit" → "shit"
 * This directly normalizes to the root word.
 */
interface CollapsedText {
  text: string;
  indexMap: number[];
}

function collapseRepeats(text: string): CollapsedText {
  let collapsed = "";
  const indexMap: number[] = [];
  let previous = "";

  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    if (char === previous) {
      continue;
    }

    collapsed += char;
    indexMap.push(i);
    previous = char;
  }

  return { text: collapsed, indexMap };
}

/**
 * Build the detection regex from the wordlist.
 * Sort longer words first so "motherfucker" matches before "fuck".
 */
function buildPattern(words: WordDef[]): RegExp {
  const sorted = [...words].sort((a, b) => b.word.length - a.word.length);
  const pattern = sorted.map((w) => w.word).join("|");
  return new RegExp(`\\b(${pattern})\\b`, "gi");
}

const DEFAULT_PATTERN = buildPattern(WORDLIST);
const WORD_MAP = new Map(WORDLIST.map((w) => [w.word.toLowerCase(), w]));

/**
 * Detect profanity in a string.
 *
 * Runs detection in two passes:
 * 1. Direct match on original text (preserves positions)
 * 2. Match on repeat-collapsed text (catches fuuuuck, shiiiiit, etc.)
 */
export function detect(text: string): DetectionResult {
  const matches: Match[] = [];
  const seen = new Set<number>(); // track original-text positions we've already matched

  // Pass 1: direct match on original (lowercase) text
  runPattern(text, text.toLowerCase(), matches, seen);

  // Pass 2: match on collapsed text to catch repeated chars
  const lower = text.toLowerCase();
  const collapsed = collapseRepeats(lower);
  if (collapsed.text !== lower) {
    runPattern(text, collapsed.text, matches, seen, collapsed.indexMap);
  }

  return { count: matches.length, matches };
}

function runPattern(
  originalText: string,
  searchText: string,
  matches: Match[],
  seen: Set<number>,
  indexMap?: number[],
  pattern: RegExp = DEFAULT_PATTERN,
  wordMap: Map<string, WordDef> = WORD_MAP,
): void {
  pattern.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(searchText)) !== null) {
    const originalIndex = indexMap?.[match.index] ?? match.index;
    if (seen.has(originalIndex)) {
      continue;
    }

    const word = match[0].toLowerCase();
    const entry = wordMap.get(word);
    if (!entry) {
      continue;
    }

    seen.add(originalIndex);
    if (isUrlOrDomainMatch(originalText, originalIndex, match[0].length)) {
      continue;
    }

    matches.push({
      word,
      index: originalIndex,
      severity: entry.severity,
      group: entry.group,
    });
  }
}

const TRAILING_TOKEN_PUNCTUATION = /[>)}\]'",;:!?.]+$/;
const LEADING_TOKEN_PUNCTUATION = /^[<([{'"`]+/;

function isUrlOrDomainMatch(text: string, matchIndex: number, matchLength: number): boolean {
  let start = matchIndex;
  while (start > 0 && !/\s/.test(text.charAt(start - 1))) {
    start--;
  }

  let end = matchIndex + matchLength;
  while (end < text.length && !/\s/.test(text.charAt(end))) {
    end++;
  }

  const rawToken = text.slice(start, end);
  const leadingLength = LEADING_TOKEN_PUNCTUATION.exec(rawToken)?.[0].length ?? 0;
  const withoutLeading = rawToken.slice(leadingLength);
  const trailingLength = TRAILING_TOKEN_PUNCTUATION.exec(withoutLeading)?.[0].length ?? 0;
  const token = withoutLeading.slice(0, withoutLeading.length - trailingLength);
  const tokenStart = start + leadingLength;

  if (token.length === 0) {
    return false;
  }

  const hostRange = domainHostRange(token);
  if (!hostRange) {
    return false;
  }

  const matchStart = matchIndex - tokenStart;
  const matchEnd = matchStart + matchLength;
  return matchStart >= hostRange.start && matchEnd <= hostRange.end;
}

function domainHostRange(token: string): { start: number; end: number } | null {
  const scheme = /^[a-z][a-z\d+.-]*:\/\//i.exec(token);
  const authorityStart = scheme?.[0].length ?? 0;
  const authorityOffset = token.slice(authorityStart).search(/[/?#]/);
  const authorityEnd =
    authorityOffset === -1 ? token.length : authorityStart + authorityOffset;
  const authority = token.slice(authorityStart, authorityEnd);
  const atIndex = authority.lastIndexOf("@");
  const hostStart = atIndex === -1 ? authorityStart : authorityStart + atIndex + 1;
  const hostWithPort = token.slice(hostStart, authorityEnd);
  const port = /:\d+$/.exec(hostWithPort);
  const hostEnd = port ? authorityEnd - port[0].length : authorityEnd;
  const host = token.slice(hostStart, hostEnd);

  if (!isDomainName(host)) {
    return null;
  }

  return { start: hostStart, end: hostEnd };
}

function isDomainName(host: string): boolean {
  const labels = host.toLowerCase().split(".");
  if (labels.length < 2) {
    return false;
  }

  const tld = labels[labels.length - 1];
  if (!tld || !/^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(tld)) {
    return false;
  }

  return labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
}

/**
 * Create a custom detector with additional words.
 */
export function createDetector(
  extraWords?: WordDef[],
): (text: string) => DetectionResult {
  const allWords = extraWords ? [...WORDLIST, ...extraWords] : WORDLIST;
  const pattern = buildPattern(allWords);
  const wordMap = new Map(allWords.map((w) => [w.word.toLowerCase(), w]));

  return (text: string): DetectionResult => {
    const matches: Match[] = [];
    const seen = new Set<number>();

    const lower = text.toLowerCase();
    runPattern(text, lower, matches, seen, undefined, pattern, wordMap);

    const collapsed = collapseRepeats(lower);
    if (collapsed.text !== lower) {
      runPattern(text, collapsed.text, matches, seen, collapsed.indexMap, pattern, wordMap);
    }

    return { count: matches.length, matches };
  };
}

export type { WordDef as WordEntry };
