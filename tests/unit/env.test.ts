import { describe, expect, it } from "vitest";
import { MissingEnvError, readSupabaseEnv } from "@/lib/env";

describe("readSupabaseEnv", () => {
  it("returns trimmed values", () => {
    expect(readSupabaseEnv(" https://x.supabase.co ", " sb_publishable_abc ")).toEqual({
      url: "https://x.supabase.co",
      publishableKey: "sb_publishable_abc",
    });
  });
  it("names every missing variable", () => {
    expect(() => readSupabaseEnv("", undefined)).toThrow(MissingEnvError);
    expect(() => readSupabaseEnv("", undefined)).toThrow(/NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
    expect(() => readSupabaseEnv("https://x.supabase.co", "  ")).toThrow(/^Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });
});
