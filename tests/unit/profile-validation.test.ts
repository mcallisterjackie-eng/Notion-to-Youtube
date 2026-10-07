import { describe, expect, it } from "vitest";
import { checkEmail, checkName, checkTimezone, listTimezones } from "@/lib/profile-validation";

describe("checkName", () => {
  it("trims and collapses spaces", () => {
    expect(checkName("  Ana   María  ")).toEqual({ ok: true, value: "Ana María" });
  });
  it("refuses empty or overlong names", () => {
    expect(checkName("   ")).toEqual({ ok: false, error: "Enter your name." });
    expect(checkName(null).ok).toBe(false);
    expect(checkName("x".repeat(201)).ok).toBe(false);
    expect(checkName("x".repeat(200)).ok).toBe(true);
  });
});

describe("checkTimezone (same rule as the database)", () => {
  it("accepts IANA names and UTC", () => {
    for (const tz of ["UTC", "America/Edmonton", "Europe/London", "America/Argentina/Buenos_Aires", "Asia/Kolkata"]) {
      expect(checkTimezone(tz)).toEqual({ ok: true, value: tz });
    }
  });
  it("refuses abbreviations, offsets, unknown zones and junk", () => {
    for (const tz of ["EST", "UTC+5", "Mars/Olympus", "", "america/edmonton", "Europe/London; drop table", 42, null]) {
      expect(checkTimezone(tz).ok).toBe(false);
    }
  });
  it("offers only zones it would accept", () => {
    const all = listTimezones();
    expect(all).toContain("UTC");
    expect(all).toContain("America/Edmonton");
    expect(all.every((tz) => checkTimezone(tz).ok)).toBe(true);
  });
});

describe("checkEmail", () => {
  it("accepts ordinary addresses and trims", () => {
    expect(checkEmail(" pat@example.com ")).toEqual({ ok: true, value: "pat@example.com" });
  });
  it("refuses malformed addresses", () => {
    for (const e of ["", "pat", "pat@", "pat@example", "a b@example.com", null]) expect(checkEmail(e).ok).toBe(false);
  });
});
