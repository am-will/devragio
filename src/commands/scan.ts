import { allAdapters, createAdapter } from "../adapters/index";
import { detect, type Severity } from "../detector/index";

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
      console.log(`swearjar scan — scan sessions for profanity

Options:
  --agent, -a <name>   Scan only a specific agent (claude, codex, opencode, amp, cline, zed)
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

  const groupTally: Record<string, number> = {};
  const variantTally: Record<string, Record<string, number>> = {};
  const severityCounts: Record<Severity, number> = {
    mild: 0,
    moderate: 0,
    strong: 0,
  };
  let totalMessages = 0;
  let totalSwears = 0;
  const perAgent: Record<string, { messages: number; swears: number }> = {};

  for (const adapter of adapters) {
    let agentMessages = 0;
    let agentSwears = 0;

    for await (const message of adapter.messages({ since: options.since })) {
      totalMessages++;
      agentMessages++;

      const result = detect(message.text);
      if (result.count > 0) {
        totalSwears += result.count;
        agentSwears += result.count;

        for (const match of result.matches) {
          groupTally[match.group] = (groupTally[match.group] ?? 0) + 1;
          severityCounts[match.severity]++;

          if (!variantTally[match.group]) variantTally[match.group] = {};
          variantTally[match.group][match.word] =
            (variantTally[match.group][match.word] ?? 0) + 1;
        }
      }
    }

    if (agentMessages > 0) {
      perAgent[adapter.name] = { messages: agentMessages, swears: agentSwears };
    }
  }

  // Report
  console.log("");
  console.log("  swearjar report");
  console.log("  ===============");
  console.log("");
  console.log(`  messages scanned:  ${totalMessages}`);
  console.log(`  total swears:      ${totalSwears}`);

  if (totalSwears > 0) {
    console.log("");
    console.log("  severity:");
    console.log(`    strong:    ${severityCounts.strong}`);
    console.log(`    moderate:  ${severityCounts.moderate}`);
    console.log(`    mild:      ${severityCounts.mild}`);
  }

  const activeAgents = Object.entries(perAgent);
  if (activeAgents.length > 1) {
    console.log("");
    console.log("  by agent:");
    for (const [name, stats] of activeAgents) {
      const rate = ((stats.swears / stats.messages) * 100).toFixed(1);
      console.log(
        `    ${name.padEnd(10)} ${String(stats.swears).padStart(4)} swears in ${stats.messages} messages (${rate}%)`,
      );
    }
  }

  if (totalSwears > 0) {
    const sorted = Object.entries(groupTally).sort(([, a], [, b]) => b - a);
    console.log("");
    console.log("  top words:");
    for (const [group, count] of sorted.slice(0, 10)) {
      const variants = variantTally[group] ?? {};
      const variantList = Object.entries(variants)
        .sort(([, a], [, b]) => b - a)
        .filter(([v]) => v !== group) // don't repeat the group name itself
        .slice(0, 15)
        .map(([v, c]) => `${v} ${c}x`)
        .join(", ");
      const suffix = variantList ? ` (${variantList})` : "";
      console.log(`    ${group.padEnd(12)} ${String(count).padStart(4)}x${suffix}`);
    }
  }

  console.log("");
  if (totalSwears === 0) {
    console.log("  squeaky clean! not a single swear found.");
    console.log("");
  }
}
