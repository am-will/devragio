import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { createInterface } from "node:readline";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Adapter, AdapterOptions, Message } from "./index";

/**
 * Pi Agent stores sessions as JSONL files at:
 *   ~/.pi/agent/sessions/<project>/<session-id>.jsonl
 *
 * Each line is a JSON object:
 *   { "type": "session", "cwd": "/path/to/project" }   — session metadata
 *   { "type": "message", "timestamp": "...", "message": { "role": "user", "content": "..." } }
 *
 * Content can be a string or array of { type: "text", text: "..." } parts.
 */

const PI_SESSIONS_DIR = join(homedir(), ".pi", "agent", "sessions");

export function piAdapter(): Adapter {
  return {
    name: "pi",
    async *messages(options?: AdapterOptions): AsyncGenerator<Message> {
      yield* walkPiSessions(PI_SESSIONS_DIR, options);
    },
  };
}

async function* walkPiSessions(
  dir: string,
  options?: AdapterOptions,
  project?: string,
): AsyncGenerator<Message> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const entryStat = await stat(fullPath).catch(() => null);
    if (!entryStat) continue;

    if (entryStat.isDirectory()) {
      yield* walkPiSessions(fullPath, options, project ?? entry);
    } else if (entry.endsWith(".jsonl")) {
      const session = entry.replace(".jsonl", "");
      yield* parsePiJsonl(fullPath, { session, project, since: options?.since });
    }
  }
}

async function* parsePiJsonl(
  filePath: string,
  context: { session: string; project?: string; since?: Date },
): AsyncGenerator<Message> {
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let project = context.project;

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line) as PiEntry;

      // Session metadata line carries cwd
      if (entry.type === "session") {
        project = entry.cwd ?? project;
        continue;
      }

      if (entry.type !== "message") continue;

      const message = entry.message;
      if (!message || message.role !== "user") continue;

      const text = contentToString(message.content);
      if (!text) continue;

      const timestamp =
        typeof entry.timestamp === "string"
          ? entry.timestamp
          : typeof message.timestamp === "number"
            ? new Date(message.timestamp).toISOString()
            : undefined;

      if (context.since && timestamp) {
        const ts = new Date(timestamp);
        if (ts < context.since) continue;
      }

      yield {
        text,
        timestamp,
        session: context.session,
        project,
      };
    } catch {
      // Skip malformed lines
    }
  }
}

function contentToString(content: unknown): string | null {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const parts = content
      .filter(
        (p): p is { type: string; text: string } =>
          typeof p === "object" &&
          p !== null &&
          p.type === "text" &&
          typeof p.text === "string",
      )
      .map((p) => p.text);
    return parts.length > 0 ? parts.join(" ") : null;
  }
  return null;
}

interface PiEntry {
  type?: string;
  timestamp?: string;
  cwd?: string;
  message?: {
    role?: string;
    content?: unknown;
    timestamp?: number;
  };
}
