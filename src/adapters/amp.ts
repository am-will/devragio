import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Adapter, AdapterOptions, Message } from "./index";

/**
 * Amp (Sourcegraph) stores threads as JSON files at:
 *   ~/.local/share/amp/threads/<thread-id>.json
 *
 * Each file is a JSON object with a `messages` array:
 *   { "messages": [{ "role": "user"|"assistant", "content": "...", ... }], "usageLedger": {...}, ... }
 *
 * Messages have `role`, `content` (string or array), and optionally a timestamp.
 */

function getAmpThreadsDir(): string {
  return join(
    process.env["XDG_DATA_HOME"] ?? join(homedir(), ".local", "share"),
    "amp",
    "threads",
  );
}

export function ampAdapter(): Adapter {
  return {
    name: "amp",
    async *messages(options?: AdapterOptions): AsyncGenerator<Message> {
      const threadsDir = getAmpThreadsDir();

      let files: string[];
      try {
        files = await readdir(threadsDir);
      } catch {
        return; // Amp not installed or no threads
      }

      const jsonFiles = files.filter((f) => f.endsWith(".json"));

      for (const file of jsonFiles) {
        const filePath = join(threadsDir, file);
        const threadId = file.replace(".json", "");

        try {
          const raw = await readFile(filePath, "utf-8");
          const thread = JSON.parse(raw) as AmpThread;

          if (!thread.messages || !Array.isArray(thread.messages)) continue;

          for (const msg of thread.messages) {
            if (msg.role !== "user") continue;

            const text = extractText(msg.content);
            if (!text) continue;

            const timestamp = msg.timestamp ?? msg.createdAt ?? undefined;
            if (options?.since && timestamp) {
              const ts = new Date(timestamp);
              if (ts < options.since) continue;
            }

            yield {
              text,
              timestamp,
              session: threadId,
            };
          }
        } catch {
          // Skip malformed files
        }
      }
    },
  };
}

function extractText(content: unknown): string | null {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const parts = content
      .filter(
        (p): p is { type: string; text: string } =>
          typeof p === "object" && p !== null && typeof p.text === "string",
      )
      .map((p) => p.text);
    return parts.length > 0 ? parts.join(" ") : null;
  }
  return null;
}

interface AmpMessage {
  role?: string;
  content?: unknown;
  timestamp?: string;
  createdAt?: string;
}

interface AmpThread {
  messages?: AmpMessage[];
}
