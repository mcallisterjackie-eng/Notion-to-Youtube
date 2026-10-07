/**
 * Input rules for My Profile. The database enforces the same limits; checking
 * here gives a friendly message before the round trip.
 */

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

export const NAME_MAX = 200;

export function checkName(input: unknown): Checked<string> {
  const value = typeof input === "string" ? input.trim().replace(/\s+/g, " ") : "";
  if (!value) return { ok: false, error: "Enter your name." };
  if (value.length > NAME_MAX) return { ok: false, error: `Use ${NAME_MAX} characters or fewer.` };
  return { ok: true, value };
}

/** Same rule as the database: IANA-style names ("America/Edmonton") or UTC, known to this runtime. */
export function checkTimezone(input: unknown): Checked<string> {
  const value = typeof input === "string" ? input.trim() : "";
  if (!/^(UTC|[A-Z][A-Za-z_+-]*(\/[A-Za-z0-9_+-]+){1,2})$/.test(value)) return { ok: false, error: "Choose a time zone from the list." };
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
  } catch {
    return { ok: false, error: "Choose a time zone from the list." };
  }
  return { ok: true, value };
}

export function checkEmail(input: unknown): Checked<string> {
  const value = typeof input === "string" ? input.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 320) return { ok: false, error: "Enter a valid email address." };
  return { ok: true, value };
}

/** Every IANA time zone this browser/runtime knows, for the picker. */
export function listTimezones(): string[] {
  const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return all.includes("UTC") ? all : ["UTC", ...all];
}
