import { describe, expect, it } from "vitest";
import { classifyStatus, errorCode } from "@/lib/integrations/http";

describe("provider failure classification", () => {
  it("treats revoked or expired tokens as reconnect-needed", () => {
    expect(classifyStatus(400, "invalid_grant")).toBe("auth");
    expect(classifyStatus(401, null)).toBe("auth");
    expect(classifyStatus(401, "unauthorized")).toBe("auth");
  });
  it("separates permission problems from rate limits on 403", () => {
    expect(classifyStatus(403, "insufficientPermissions")).toBe("permission");
    expect(classifyStatus(403, "restricted_resource")).toBe("permission");
    expect(classifyStatus(403, "rateLimitExceeded")).toBe("rate_limited");
    expect(classifyStatus(403, "userRateLimitExceeded")).toBe("rate_limited");
  });
  it("classifies the rest", () => {
    expect(classifyStatus(404, null)).toBe("not_found");
    expect(classifyStatus(429, "rate_limited")).toBe("rate_limited");
    expect(classifyStatus(503, null)).toBe("temporary");
    expect(classifyStatus(400, "validation_error")).toBe("bad_request");
  });
  it("reads error codes from OAuth, Notion and Google bodies", () => {
    expect(errorCode({ error: "invalid_grant", error_description: "Bad Request" })).toBe("invalid_grant");
    expect(errorCode({ object: "error", status: 401, code: "unauthorized" })).toBe("unauthorized");
    expect(errorCode({ error: { code: 403, errors: [{ reason: "insufficientPermissions" }], status: "PERMISSION_DENIED" } })).toBe("insufficientPermissions");
    expect(errorCode({ error: { code: 403, status: "PERMISSION_DENIED" } })).toBe("PERMISSION_DENIED");
    expect(errorCode(null)).toBeNull();
    expect(errorCode("text")).toBeNull();
  });
});
