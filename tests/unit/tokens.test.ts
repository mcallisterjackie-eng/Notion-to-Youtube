import { describe, expect, it } from "vitest";
import { fromTokenResponse, missingScopes, needsRefresh, parse, REFRESH_MARGIN_SECONDS, serialize } from "@/lib/integrations/tokens";

const NOW = Date.UTC(2026, 9, 7, 12, 0, 0);
const nowS = NOW / 1000;

describe("token bundle", () => {
  it("reads a Google token response, including granted scopes", () => {
    const t = fromTokenResponse({ access_token: "a", refresh_token: "r", expires_in: 3599, scope: "s1 s2" }, null, NOW);
    expect(t).toEqual({ accessToken: "a", refreshToken: "r", expiresAt: nowS + 3599, scopes: ["s1", "s2"] });
  });

  it("keeps the old refresh token and scopes when a refresh omits them", () => {
    const prev = { accessToken: "a", refreshToken: "r1", expiresAt: 0, scopes: ["s1"] };
    expect(fromTokenResponse({ access_token: "b", expires_in: 60 }, prev, NOW)).toEqual({ accessToken: "b", refreshToken: "r1", expiresAt: nowS + 60, scopes: ["s1"] });
  });

  it("stores Notion's rotated refresh token", () => {
    const prev = { accessToken: "a", refreshToken: "old", expiresAt: null, scopes: [] };
    expect(fromTokenResponse({ access_token: "b", refresh_token: "new" }, prev, NOW).refreshToken).toBe("new");
  });

  it("treats tokens without an expiry as valid until rejected", () => {
    expect(fromTokenResponse({ access_token: "a" }, null, NOW).expiresAt).toBeNull();
    expect(needsRefresh({ accessToken: "a", refreshToken: null, expiresAt: null, scopes: [] }, NOW)).toBe(false);
  });

  it("refreshes a little before expiry", () => {
    const t = (expiresAt: number) => ({ accessToken: "a", refreshToken: "r", expiresAt, scopes: [] });
    expect(needsRefresh(t(nowS + REFRESH_MARGIN_SECONDS + 10), NOW)).toBe(false);
    expect(needsRefresh(t(nowS + REFRESH_MARGIN_SECONDS - 10), NOW)).toBe(true);
    expect(needsRefresh(t(nowS - 1), NOW)).toBe(true);
  });

  it("rejects responses without an access token", () => {
    expect(() => fromTokenResponse({ refresh_token: "r" })).toThrow();
  });

  it("serializes and parses, ignoring garbage", () => {
    const t = { accessToken: "a", refreshToken: "r", expiresAt: 1, scopes: ["x"] };
    expect(parse(serialize(t))).toEqual(t);
    expect(parse(null)).toBeNull();
    expect(parse("{not json")).toBeNull();
    expect(parse('{"accessToken":""}')).toBeNull();
  });

  it("finds scopes the person unticked", () => {
    expect(missingScopes(["a", "b"], ["a", "b"])).toEqual([]);
    expect(missingScopes(["a"], ["a", "b"])).toEqual(["b"]);
    expect(missingScopes([], ["a"])).toEqual(["a"]);
  });
});
