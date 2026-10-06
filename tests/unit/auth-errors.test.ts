import { describe, expect, it } from "vitest";
import { CONFIG_AUTH_ERROR, friendlyAuthError, GENERIC_AUTH_ERROR } from "@/lib/auth-errors";

describe("friendlyAuthError", () => {
  it("maps known Supabase error codes to plain English", () => {
    expect(friendlyAuthError({ code: "invalid_credentials", message: "Invalid login credentials" })).toMatch(/do not match/);
    expect(friendlyAuthError({ code: "email_not_confirmed" })).toMatch(/Confirm your email/);
    expect(friendlyAuthError({ code: "user_already_exists" })).toMatch(/already exists/);
  });
  it("never shows raw technical messages", () => {
    expect(friendlyAuthError({ code: "unexpected_failure", message: "pq: relation does not exist" })).toBe(GENERIC_AUTH_ERROR);
    expect(friendlyAuthError({ message: "fetch failed" })).toBe(GENERIC_AUTH_ERROR);
    expect(friendlyAuthError(null)).toBe(GENERIC_AUTH_ERROR);
  });
  it("explains missing configuration without naming variables", () => {
    expect(friendlyAuthError({ name: "MissingEnvError", message: "Missing NEXT_PUBLIC_SUPABASE_URL" })).toBe(CONFIG_AUTH_ERROR);
  });
});
