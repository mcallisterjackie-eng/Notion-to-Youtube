import { describe, expect, it } from "vitest";
import { newState, pkceChallenge, seal, STATE_TTL_SECONDS, unseal, verifyState } from "@/lib/oauth/state";

const SECRET = "x".repeat(40);
const OTHER = "y".repeat(40);

describe("OAuth state cookie", () => {
  const base = { provider: "youtube" as const, userId: "user-1", returnTo: "/dashboard/setup" };

  it("round-trips through encryption", () => {
    const s = newState(base);
    expect(unseal(seal(s, SECRET), SECRET)).toEqual(s);
  });

  it("uses fresh random values each time", () => {
    const a = newState(base);
    const b = newState(base);
    expect(a.state).not.toBe(b.state);
    expect(a.codeVerifier).not.toBe(b.codeVerifier);
    expect(a.codeVerifier.length).toBeGreaterThanOrEqual(43); // RFC 7636 minimum
  });

  it("rejects tampered, foreign or malformed cookies", () => {
    const sealed = seal(newState(base), SECRET);
    const [iv, body, tag] = sealed.split(".");
    const flipped = body.slice(0, -2) + (body.endsWith("A") ? "BB" : "AA");
    expect(unseal(`${iv}.${flipped}.${tag}`, SECRET)).toBeNull();
    expect(unseal(sealed, OTHER)).toBeNull();
    expect(unseal("not-a-cookie", SECRET)).toBeNull();
    expect(unseal(undefined, SECRET)).toBeNull();
  });

  it("refuses to run with a short or missing secret", () => {
    expect(() => seal(newState(base), "short")).toThrow(/OAUTH_STATE_SECRET/);
  });

  it("accepts the matching state from the same person", () => {
    const s = newState(base);
    const r = verifyState(seal(s, SECRET), { provider: "youtube", state: s.state, userId: "user-1" }, Date.now(), SECRET);
    expect(r).toEqual({ ok: true, state: s });
  });

  it("blocks forged, replayed or misdirected returns", () => {
    const t0 = Date.now();
    const s = newState(base, t0);
    const sealed = seal(s, SECRET);
    const check = (input: Partial<{ provider: "notion" | "youtube" | "google_drive"; state: string | null; userId: string }>, now = t0) =>
      verifyState(sealed, { provider: "youtube", state: s.state, userId: "user-1", ...input }, now, SECRET);

    expect(check({ state: "attacker-state" })).toEqual({ ok: false, reason: "mismatch" });
    expect(check({ state: null })).toEqual({ ok: false, reason: "missing" });
    expect(check({ userId: "someone-else" })).toEqual({ ok: false, reason: "wrong_user" });
    expect(check({ provider: "google_drive" })).toEqual({ ok: false, reason: "wrong_provider" });
    expect(check({}, t0 + (STATE_TTL_SECONDS + 5) * 1000)).toEqual({ ok: false, reason: "expired" });
    expect(verifyState(undefined, { provider: "youtube", state: s.state, userId: "user-1" }, t0, SECRET)).toEqual({ ok: false, reason: "missing" });
  });

  it("computes the RFC 7636 S256 challenge", () => {
    // Test vector from RFC 7636 Appendix B.
    expect(pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });
});
