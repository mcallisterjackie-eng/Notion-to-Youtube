import { describe, expect, it } from "vitest";
import { toDisplayUser } from "@/lib/user";

describe("toDisplayUser", () => {
  it("uses the name given at sign-up", () => {
    expect(toDisplayUser({ email: "ana@x.com", user_metadata: { full_name: "Ana María Ruiz" } })).toEqual({
      name: "Ana María Ruiz",
      email: "ana@x.com",
      initials: "AR",
    });
  });
  it("accepts a provider's `name`", () => {
    expect(toDisplayUser({ email: "a@x.com", user_metadata: { name: "Sam" } }).initials).toBe("SA");
  });
  it("falls back to the email's first part", () => {
    expect(toDisplayUser({ email: "creator@x.com", user_metadata: {} })).toMatchObject({ name: "creator", initials: "CR" });
  });
  it("copes with missing claims", () => {
    expect(toDisplayUser(null)).toEqual({ name: "Your account", email: "", initials: "?" });
    expect(toDisplayUser({ email: 42, user_metadata: "bad" })).toMatchObject({ name: "Your account", email: "" });
  });
});
