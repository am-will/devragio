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
  categories: string[];
}

export type Severity = "mild" | "moderate" | "strong";

export interface WordEntry {
  /** The word to match */
  word: string;
  severity: Severity;
  categories: string[];
}

/**
 * Words where partial match would cause false positives.
 * These require exact word-boundary matching only.
 *
 * e.g. "ass" should NOT match "class", "assign", "assessment"
 *      "hell" should NOT match "hello", "shell", "hellebore"
 *      "damn" should NOT match "goddamn" wait actually that SHOULD match
 */
const WORDLIST: WordEntry[] = [
  // Strong
  { word: "fuck", severity: "strong", categories: ["profanity"] },
  { word: "fucking", severity: "strong", categories: ["profanity"] },
  { word: "fucked", severity: "strong", categories: ["profanity"] },
  { word: "fucker", severity: "strong", categories: ["profanity"] },
  { word: "motherfucker", severity: "strong", categories: ["profanity"] },
  { word: "motherfucking", severity: "strong", categories: ["profanity"] },
  { word: "shit", severity: "strong", categories: ["profanity"] },
  { word: "shitty", severity: "strong", categories: ["profanity"] },
  { word: "bullshit", severity: "strong", categories: ["profanity"] },
  { word: "horseshit", severity: "strong", categories: ["profanity"] },
  { word: "asshole", severity: "strong", categories: ["profanity", "insult"] },
  { word: "bitch", severity: "strong", categories: ["profanity", "insult"] },
  { word: "bastard", severity: "strong", categories: ["profanity", "insult"] },

  // Moderate
  { word: "ass", severity: "moderate", categories: ["profanity"] },
  { word: "damn", severity: "moderate", categories: ["profanity"] },
  { word: "damned", severity: "moderate", categories: ["profanity"] },
  { word: "damnit", severity: "moderate", categories: ["profanity"] },
  { word: "goddamn", severity: "moderate", categories: ["profanity"] },
  { word: "goddamnit", severity: "moderate", categories: ["profanity"] },
  { word: "piss", severity: "moderate", categories: ["profanity"] },
  { word: "pissed", severity: "moderate", categories: ["profanity"] },
  { word: "dick", severity: "moderate", categories: ["profanity"] },
  { word: "crap", severity: "moderate", categories: ["profanity"] },
  { word: "crappy", severity: "moderate", categories: ["profanity"] },

  // Mild
  { word: "hell", severity: "mild", categories: ["profanity"] },
  { word: "wtf", severity: "mild", categories: ["abbreviation"] },
  { word: "stfu", severity: "mild", categories: ["abbreviation"] },
  { word: "lmfao", severity: "mild", categories: ["abbreviation"] },
];

/**
 * Build the detection regex. Uses word boundaries (\b) to prevent
 * matching substrings within other words.
 *
 * \b matches at a position between a word character (\w) and a non-word
 * character. This means:
 *   - "ass" won't match in "class" (l→a is word→word, no boundary)
 *   - "ass" won't match in "assign" (same reason)
 *   - "hell" won't match in "hello" or "shell"
 *   - "ass" WILL match in "kick-ass" (hyphen is non-word)
 *   - "shit" WILL match standalone or in "oh shit"
 */
function buildPattern(words: WordEntry[]): RegExp {
  // Sort longer words first so "motherfucker" matches before "fuck"
  const sorted = [...words].sort((a, b) => b.word.length - a.word.length);
  const pattern = sorted.map((w) => w.word).join("|");
  return new RegExp(`\\b(${pattern})\\b`, "gi");
}

const DEFAULT_PATTERN = buildPattern(WORDLIST);
const WORD_MAP = new Map(WORDLIST.map((w) => [w.word.toLowerCase(), w]));

/**
 * Detect profanity in a string.
 */
export function detect(text: string): DetectionResult {
  const matches: Match[] = [];

  // Reset lastIndex for global regex
  DEFAULT_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = DEFAULT_PATTERN.exec(text)) !== null) {
    const word = match[0].toLowerCase();
    const entry = WORD_MAP.get(word);
    if (!entry) continue;

    matches.push({
      word,
      index: match.index,
      severity: entry.severity,
      categories: entry.categories,
    });
  }

  return { count: matches.length, matches };
}

/**
 * Create a custom detector with additional words or overrides.
 */
export function createDetector(
  extraWords?: WordEntry[],
): (text: string) => DetectionResult {
  const allWords = extraWords ? [...WORDLIST, ...extraWords] : WORDLIST;
  const pattern = buildPattern(allWords);
  const wordMap = new Map(allWords.map((w) => [w.word.toLowerCase(), w]));

  return (text: string): DetectionResult => {
    const matches: Match[] = [];
    pattern.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const word = match[0].toLowerCase();
      const entry = wordMap.get(word);
      if (!entry) continue;

      matches.push({
        word,
        index: match.index,
        severity: entry.severity,
        categories: entry.categories,
      });
    }

    return { count: matches.length, matches };
  };
}
