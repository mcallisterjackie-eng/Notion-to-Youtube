import { describe, expect, it } from "vitest";
import { connectionErrorMessage, PROVIDER_ACCESS, PROVIDER_NAMES } from "@/lib/connection-messages";
import { setupProgress } from "@/lib/setup";

const c = (status: string) => ({ status });

describe("setupProgress", () => {
  it("starts with nothing done and Notion next", () => {
    const p = setupProgress({ notion: c("not_connected"), youtube: c("not_connected"), google_drive: c("not_connected") }, false, false);
    expect(p).toMatchObject({ done: 0, total: 5, complete: false, next: "notion" });
  });
  it("only counts healthy connections as done", () => {
    const p = setupProgress({ notion: c("connected"), youtube: c("permission_problem"), google_drive: c("error") }, false, false);
    expect(p.steps).toEqual({ notion: true, youtube: false, google_drive: false, database: false, timezone: false });
    expect(p.next).toBe("youtube");
  });
  it("lets steps be skipped: next is the first unfinished one", () => {
    const p = setupProgress({ notion: c("connected"), youtube: c("not_connected"), google_drive: c("connected") }, true, true);
    expect(p).toMatchObject({ done: 4, complete: false, next: "youtube" });
  });
  it("is complete only when every step is done", () => {
    const p = setupProgress({ notion: c("connected"), youtube: c("connected"), google_drive: c("connected") }, true, true);
    expect(p).toMatchObject({ done: 5, complete: true, next: null });
  });
});

describe("connection messages", () => {
  it("use plain service names and never raw scope URLs", () => {
    for (const p of ["notion", "youtube", "google_drive"] as const) {
      expect(PROVIDER_ACCESS[p]).not.toMatch(/googleapis|auth\/|scope/i);
      expect(connectionErrorMessage("reconnect_required", p)).toContain(PROVIDER_NAMES[p]);
    }
  });
  it("fall back to a generic message for unknown codes", () => {
    expect(connectionErrorMessage("something_new", "youtube")).toMatch(/Something went wrong connecting YouTube/);
    expect(connectionErrorMessage(null, "notion")).toMatch(/Notion/);
  });
});
