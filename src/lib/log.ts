/**
 * Minimal structured logger. Writes one JSON line per event to the console,
 * which Vercel collects as runtime logs. A hosted error-reporting service is
 * deferred to Phase 10; swap the `write` function then.
 *
 * Never log secrets, tokens, passwords or full request bodies.
 */

type Level = "info" | "warn" | "error";

function write(level: Level, event: string, message: string, context?: Record<string, unknown>) {
  const line = JSON.stringify({ level, event, message, ...context, at: new Date().toISOString() });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const log = {
  info: (event: string, message: string, context?: Record<string, unknown>) => write("info", event, message, context),
  warn: (event: string, message: string, context?: Record<string, unknown>) => write("warn", event, message, context),
  error: (event: string, message: string, context?: Record<string, unknown>) => write("error", event, message, context),
};
