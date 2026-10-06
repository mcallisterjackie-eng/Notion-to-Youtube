import { describe, expect, it } from "vitest";
import { decideRoute, isGuestOnlyPath, isProtectedPath, safeNextPath } from "@/lib/routes";

describe("isProtectedPath", () => {
  it("protects the dashboard and everything under it", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/dashboard/billing")).toBe(true);
    expect(isProtectedPath("/dashboard/field-mapping")).toBe(true);
  });
  it("does not protect public pages or look-alike paths", () => {
    for (const p of ["/", "/login", "/products", "/videos", "/dashboards", "/dashboard-old", "/auth/callback"]) {
      expect(isProtectedPath(p)).toBe(false);
    }
  });
});

describe("isGuestOnlyPath", () => {
  it("covers the sign-in pages but not password reset", () => {
    expect(isGuestOnlyPath("/login")).toBe(true);
    expect(isGuestOnlyPath("/signup")).toBe(true);
    expect(isGuestOnlyPath("/forgot-password")).toBe(true);
    expect(isGuestOnlyPath("/reset-password")).toBe(false);
  });
});

describe("decideRoute", () => {
  it("sends signed-out visitors to log in and remembers where they were going", () => {
    expect(decideRoute("/dashboard/billing", "?tab=invoices", false)).toEqual({
      redirect: "/login?next=%2Fdashboard%2Fbilling%3Ftab%3Dinvoices",
    });
  });
  it("lets signed-in users into the dashboard", () => {
    expect(decideRoute("/dashboard", "", true)).toBeNull();
  });
  it("sends signed-in users away from the sign-in pages", () => {
    expect(decideRoute("/login", "", true)).toEqual({ redirect: "/dashboard" });
    expect(decideRoute("/signup", "", true)).toEqual({ redirect: "/dashboard" });
  });
  it("leaves public pages alone either way", () => {
    expect(decideRoute("/", "", false)).toBeNull();
    expect(decideRoute("/videos", "", true)).toBeNull();
    expect(decideRoute("/login", "", false)).toBeNull();
  });
});

describe("safeNextPath", () => {
  it("keeps same-site paths, including query and hash", () => {
    expect(safeNextPath("/dashboard/billing")).toBe("/dashboard/billing");
    expect(safeNextPath("/reset-password")).toBe("/reset-password");
    expect(safeNextPath("/dashboard?x=1#y")).toBe("/dashboard?x=1#y");
  });
  it("falls back for empty values", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });
  it("blocks redirects to other websites", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "\\\\evil.example",
      "javascript:alert(1)",
      "evil.example/path",
      "/\t/evil.example",
      "/%0a/evil.example".replace("%0a", "\n"),
    ]) {
      expect(safeNextPath(bad)).toBe("/dashboard");
    }
  });
  it("uses the given fallback", () => {
    expect(safeNextPath("//x", "/login")).toBe("/login");
  });
});
