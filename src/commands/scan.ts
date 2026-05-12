import { allAdapters, createAdapter } from "../adapters/index";
import { detect } from "../detector/index";
import { detectPoliteness } from "../politeness/index";

// ANSI color helpers — no dependencies needed
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

const SPINNER_MESSAGES = [
  "Tallying the damage",
  "Reviewing your outbursts",
  "Judging your vocabulary",
  "Computing your shame",
  "Cataloging the profanity",
  "Measuring your frustration",
  "Assessing the verbal carnage",
  "Quantifying your displeasure",
  "Auditing your language",
  "Tabulating regrets",
];

interface Tier {
  max: number;
  labels: string[];
  color: string;
}

const TIERS: Tier[] = [
  {
    max: 0.15,
    color: "\x1b[32m",
    labels: [
      "😇 Touched By An Angel",
      "🫶 Chronic People Pleaser",
      "🛒 Returns The Shopping Cart Every Time",
      "📺 Watched Mr Rogers Growing Up",
      "👶 Was Raised Right",
    ],
  },
  {
    max: 0.25,
    color: "\x1b[32m",
    labels: [
      "🇨🇦 Sorry Eh",
      "📓 Keeps A Gratitude Journal",
      "🚌 Thanks The Bus Driver",
      "☎️ Holds Doors For Ghosts",
      "🍵 Owns A 'Live Laugh Love' Mug",
    ],
  },
  {
    max: 0.35,
    color: "\x1b[33m",
    labels: [
      "🙃 Passive-Aggressive",
      "📧 Per My Last Email",
      "🍷 One Glass Of Wine From A Rant",
      "📅 Could've Been A Meeting",
      "😶 Replies 'K.' To Texts",
    ],
  },
  {
    max: 0.5,
    color: "\x1b[33m",
    labels: [
      "😤 Bargaining Stage",
      "🚶 Needs A Long Walk",
      "💧 Hydrate Maybe?",
      "🛋️ Cousin Is Concerned",
      "😮‍💨 Sighs Audibly On Zoom",
    ],
  },
  {
    max: 0.67,
    color: "\x1b[31m",
    labels: [
      "🤬 Friday Deploy",
      "🛟 Therapist Has Notes",
      "👀 HR Is Watching",
      "🌱 Should Touch Grass",
      "💔 Partner Is Worried",
    ],
  },
  {
    max: Infinity,
    color: "\x1b[1m\x1b[31m",
    labels: [
      "💀 Keyboard Smasher",
      "🚨 Seek Professional Help",
      "📞 Group Chat Has Held An Intervention",
      "⚰️ Last Saw The Sun In 2023",
      "👹 Is The Reason We Have HR",
    ],
  },
];

interface ChosenTier {
  color: string;
  label: string;
}

function getTier(swears: number, polite: number): ChosenTier | null {
  if (polite === 0 && swears === 0) return null;
  let tier: Tier;
  if (polite === 0) {
    tier = TIERS[TIERS.length - 1];
  } else {
    const ratio = swears / polite;
    tier = TIERS.find((t) => ratio < t.max) ?? TIERS[TIERS.length - 1];
  }
  const label = tier.labels[Math.floor(Math.random() * tier.labels.length)];
  return { color: tier.color, label };
}

const ANSI_RE = /\x1b\[[0-9;]*m/g;
const GRAPHEME_SEGMENTER =
  typeof Intl !== "undefined" && (Intl as { Segmenter?: unknown }).Segmenter
    ? new Intl.Segmenter("en", { granularity: "grapheme" })
    : null;

function visualWidth(s: string): number {
  const stripped = s.replace(ANSI_RE, "");
  if (!GRAPHEME_SEGMENTER) return stripped.length;
  let width = 0;
  for (const { segment } of GRAPHEME_SEGMENTER.segment(stripped)) {
    const cp = segment.codePointAt(0) ?? 0;
    // ASCII single chars = 1 col; everything else (emoji, CJK, etc.) = 2 cols
    if (segment.length === 1 && cp < 0x80) width += 1;
    else width += 2;
  }
  return width;
}

function createSpinner() {
  let messageIdx = 0;
  let dotCount = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  return {
    start() {
      messageIdx = Math.floor(Math.random() * SPINNER_MESSAGES.length);
      timer = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        const msg = SPINNER_MESSAGES[messageIdx % SPINNER_MESSAGES.length];
        const dots = ".".repeat(dotCount || 1);
        process.stdout.write(
          `\r  ${c.dim}${msg}${dots}${c.reset}   `,
        );
      }, 300);
    },
    update() {
      messageIdx++;
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      process.stdout.write("\r" + " ".repeat(60) + "\r");
    },
  };
}

interface ScanOptions {
  agent?: string;
  since?: Date;
}

function parseArgs(args: string[]): ScanOptions {
  const options: ScanOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--agent" || arg === "-a") {
      options.agent = args[++i];
    } else if (arg === "--since" || arg === "-s") {
      const val = args[++i];
      if (val) {
        options.since = new Date(val);
        if (isNaN(options.since.getTime())) {
          console.error(`invalid date: ${val}`);
          process.exit(1);
        }
      }
    } else if (arg === "--help" || arg === "-h") {
      console.log(`devrage scan — scan sessions for profanity

Options:
  --agent, -a <name>   Scan only a specific agent (claude, codex, opencode, amp, cline, pi, zed)
  --since, -s <date>   Only scan messages after this date (ISO 8601)
  --help, -h           Show this help`);
      process.exit(0);
    }
  }

  return options;
}

export async function scan(args: string[]): Promise<void> {
  const options = parseArgs(args);

  const adapters = options.agent
    ? [createAdapter(options.agent)]
    : allAdapters();

  const spinner = createSpinner();
  spinner.start();

  const groupTally: Record<string, number> = {};
  const variantTally: Record<string, Record<string, number>> = {};
  const politeGroupTally: Record<string, number> = {};
  const politeVariantTally: Record<string, Record<string, number>> = {};

  let totalMessages = 0;
  let totalSwears = 0;
  let totalPolite = 0;
  const perAgent: Record<string, { messages: number; swears: number; polite: number }> = {};

  for (const adapter of adapters) {
    let agentMessages = 0;
    let agentSwears = 0;
    let agentPolite = 0;
    spinner.update();

    for await (const message of adapter.messages({ since: options.since })) {
      totalMessages++;
      agentMessages++;

      const result = detect(message.text);
      if (result.count > 0) {
        totalSwears += result.count;
        agentSwears += result.count;

        for (const match of result.matches) {
          groupTally[match.group] = (groupTally[match.group] ?? 0) + 1;

          const variants = (variantTally[match.group] ??= {});
          variants[match.word] = (variants[match.word] ?? 0) + 1;
        }
      }

      const politeResult = detectPoliteness(message.text);
      if (politeResult.count > 0) {
        totalPolite += politeResult.count;
        agentPolite += politeResult.count;

        for (const match of politeResult.matches) {
          politeGroupTally[match.group] = (politeGroupTally[match.group] ?? 0) + 1;
          const variants = (politeVariantTally[match.group] ??= {});
          variants[match.word] = (variants[match.word] ?? 0) + 1;
        }
      }
    }

    if (agentMessages > 0) {
      perAgent[adapter.name] = { messages: agentMessages, swears: agentSwears, polite: agentPolite };
    }
  }

  spinner.stop();

  // Report
  console.log("");
  console.log(`  ${c.bold}${c.magenta}devragio${c.reset} ${c.dim}report${c.reset}`);
  console.log(`  ${c.dim}${"─".repeat(30)}${c.reset}`);
  console.log("");
  const ratioStr = (swears: number, polite: number): string => {
    if (polite === 0) return swears === 0 ? "—" : "∞";
    return (swears / polite).toFixed(2);
  };

  console.log(`  ${c.dim}messages scanned${c.reset}  ${c.bold}${totalMessages}${c.reset}`);
  console.log(`  ${c.dim}total swears${c.reset}      ${c.bold}${c.red}${totalSwears}${c.reset}`);
  console.log(`  ${c.dim}total polite${c.reset}      ${c.bold}${c.green}${totalPolite}${c.reset}`);

  const activeAgents = Object.entries(perAgent);
  if (activeAgents.length > 1) {
    console.log("");
    console.log(`  ${c.bold}by agent${c.reset}`);
    console.log(
      `    ${c.dim}${"agent".padEnd(10)} ${"msgs".padStart(6)} ${"swear".padStart(6)} ${"polite".padStart(7)} ${"ratio".padStart(7)}${c.reset}`,
    );
    for (const [name, stats] of activeAgents) {
      const rate = ((stats.swears / stats.messages) * 100).toFixed(1);
      const ratio = ratioStr(stats.swears, stats.polite);
      console.log(
        `    ${c.cyan}${name.padEnd(10)}${c.reset} ${String(stats.messages).padStart(6)} ${c.red}${String(stats.swears).padStart(6)}${c.reset} ${c.green}${String(stats.polite).padStart(7)}${c.reset} ${c.yellow}${ratio.padStart(7)}${c.reset} ${c.dim}(${rate}% swear)${c.reset}`,
      );
    }
  }

  if (totalSwears > 0) {
    const sorted = Object.entries(groupTally).sort(([, a], [, b]) => b - a);
    console.log("");
    console.log(`  ${c.bold}top swear words${c.reset}`);
    for (const [group, count] of sorted.slice(0, 10)) {
      const variants = variantTally[group] ?? {};
      const variantList = Object.entries(variants)
        .sort(([, a], [, b]) => b - a)
        .filter(([v]) => v !== group)
        .slice(0, 15)
        .map(([v, cnt]) => `${c.dim}${v}${c.reset} ${cnt}`)
        .join(`${c.dim},${c.reset} `);
      const suffix = variantList ? ` ${c.dim}(${c.reset}${variantList}${c.dim})${c.reset}` : "";
      console.log(
        `    ${c.yellow}${group.padEnd(12)}${c.reset} ${c.bold}${String(count).padStart(4)}${c.reset}${suffix}`,
      );
    }
  }

  if (totalPolite > 0) {
    const sorted = Object.entries(politeGroupTally).sort(([, a], [, b]) => b - a);
    console.log("");
    console.log(`  ${c.bold}top polite words${c.reset}`);
    for (const [group, count] of sorted.slice(0, 10)) {
      const variants = politeVariantTally[group] ?? {};
      const variantList = Object.entries(variants)
        .sort(([, a], [, b]) => b - a)
        .filter(([v]) => v !== group)
        .slice(0, 15)
        .map(([v, cnt]) => `${c.dim}${v}${c.reset} ${cnt}`)
        .join(`${c.dim},${c.reset} `);
      const suffix = variantList ? ` ${c.dim}(${c.reset}${variantList}${c.dim})${c.reset}` : "";
      console.log(
        `    ${c.green}${group.padEnd(12)}${c.reset} ${c.bold}${String(count).padStart(4)}${c.reset}${suffix}`,
      );
    }
  }

  // Bordered Ragio footer
  const tier = getTier(totalSwears, totalPolite);
  if (tier) {
    const ratio = ratioStr(totalSwears, totalPolite);
    const ratioLabel = `${c.dim}ratio${c.reset} ${c.bold}${c.yellow}${ratio}${c.reset}`;
    const tierLabel = `${tier.color}${tier.label}${c.reset}`;
    const inner = `  ${ratioLabel}  ${c.dim}·${c.reset}  ${tierLabel}  `;
    const innerW = visualWidth(inner);

    const heading = ` Ragio `;
    const headingVisual = `─${c.bold}${c.magenta}${heading}${c.reset}`;
    const headingW = visualWidth(headingVisual);
    const innerWidth = Math.max(innerW, headingW + 3);

    const topDashes = "─".repeat(innerWidth - headingW);
    const top = `${c.magenta}╭${c.reset}${headingVisual}${c.magenta}${topDashes}╮${c.reset}`;
    const bot = `${c.magenta}╰${"─".repeat(innerWidth)}╯${c.reset}`;
    const blank = `${c.magenta}│${c.reset}${" ".repeat(innerWidth)}${c.magenta}│${c.reset}`;
    const mid = `${c.magenta}│${c.reset}${inner}${" ".repeat(innerWidth - innerW)}${c.magenta}│${c.reset}`;

    console.log("");
    console.log(`  ${top}`);
    console.log(`  ${blank}`);
    console.log(`  ${mid}`);
    console.log(`  ${blank}`);
    console.log(`  ${bot}`);
  }

  console.log("");
  if (totalSwears === 0) {
    console.log(`  ${c.green}squeaky clean! not a single swear found.${c.reset}`);
    console.log("");
  }
}


