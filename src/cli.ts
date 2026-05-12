import { scan } from "./commands/scan";

const COMMANDS: Record<string, (args: string[]) => Promise<void>> = {
  scan,
};

function usage(): void {
  console.log(`devragio — count how many times you swear at and thank your coding agents

Usage:
  devragio <command> [options]

Commands:
  scan          Scan sessions for profanity and politeness

Options:
  --help, -h    Show this help message
  --version     Show version

Examples:
  devragio scan
  devragio scan --agent claude
  devragio scan --since 2025-01-01`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "--help" || command === "-h") {
    usage();
    process.exit(0);
  }

  if (command === "--version") {
    console.log("0.1.0");
    process.exit(0);
  }

  // If no command or not a known command, default to scan
  const handler = command ? COMMANDS[command] : undefined;
  if (handler) {
    await handler(args.slice(1));
  } else {
    // Pass all args through to scan (covers both no-arg and unknown-arg cases)
    await scan(args);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
