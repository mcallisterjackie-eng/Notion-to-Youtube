import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests run against a production build of the app, pointed at a local
 * stand-in for Supabase Auth (tests/e2e/mock-supabase.mjs), so they need no
 * real project, secrets or network.
 */
const APP_PORT = 3100;
const MOCK_PORT = 54399;

// Cloud sessions ship a pre-installed Chromium; CI installs Playwright's own.
const localChromium = "/opt/pw-browsers/chromium";
const executablePath = !process.env.CI && existsSync(localChromium) ? localChromium : undefined;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    trace: "retain-on-failure",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } } },
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions: { executablePath } } },
  ],
  webServer: [
    {
      command: "node tests/e2e/mock-supabase.mjs",
      url: `http://127.0.0.1:${MOCK_PORT}/auth/v1/settings`,
      env: { MOCK_SUPABASE_PORT: String(MOCK_PORT), MOCK_GOOGLE: "1" },
      reuseExistingServer: false,
    },
    {
      command: `npm run build && npx next start -p ${APP_PORT} -H 127.0.0.1`,
      url: `http://127.0.0.1:${APP_PORT}/`,
      timeout: 240_000,
      env: {
        NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${APP_PORT}`,
        NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only",
      },
      reuseExistingServer: false,
    },
  ],
});
