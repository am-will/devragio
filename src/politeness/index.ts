export interface PolitenessResult {
  count: number;
  matches: PolitenessMatch[];
}

export interface PolitenessMatch {
  word: string;
  index: number;
  group: string;
}

interface PoliteWordDef {
  word: string;
  group: string;
}

const WORDLIST: PoliteWordDef[] = [
  // please
  { word: "please", group: "please" },
  { word: "pls", group: "please" },
  { word: "plz", group: "please" },

  // thanks / thank you
  { word: "thank you", group: "thanks" },
  { word: "thanks", group: "thanks" },
  { word: "ty", group: "thanks" },

  // appreciate
  { word: "appreciate", group: "appreciate" },
  { word: "appreciated", group: "appreciate" },
  { word: "appreciates", group: "appreciate" },
  { word: "appreciating", group: "appreciate" },
];

function buildPattern(words: PoliteWordDef[]): RegExp {
  const sorted = [...words].sort((a, b) => b.word.length - a.word.length);
  const pattern = sorted.map((w) => w.word).join("|");
  return new RegExp(`\\b(${pattern})\\b`, "gi");
}

const PATTERN = buildPattern(WORDLIST);
const WORD_MAP = new Map(WORDLIST.map((w) => [w.word.toLowerCase(), w]));

export function detectPoliteness(text: string): PolitenessResult {
  const matches: PolitenessMatch[] = [];
  const lower = text.toLowerCase();
  PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = PATTERN.exec(lower)) !== null) {
    const word = match[0].toLowerCase();
    const entry = WORD_MAP.get(word);
    if (!entry) continue;
    matches.push({ word, index: match.index, group: entry.group });
  }

  return { count: matches.length, matches };
}
