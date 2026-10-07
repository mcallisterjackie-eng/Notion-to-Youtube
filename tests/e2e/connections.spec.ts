import { expect, test, type Page } from "@playwright/test";

const MOCK = "http://127.0.0.1:54399";
const CASEY = { email: "connector@example.com", password: "connect-me-please" };
const NICO = { email: "neighbour@example.com", password: "neighbour-password" };

async function logInAs(page: Page, who: { email: string; password: string }, to = "/dashboard/setup") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password").fill(who.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/dashboard");
  await page.goto(to);
}
const mock = (page: Page, path: string, data?: object) => page.request.post(`${MOCK}${path}`, { data: data ?? {} });
const card = (page: Page, provider: string) => page.locator(`[data-provider="${provider}"]`);

test.describe.configure({ mode: "serial" });
test.beforeEach(async ({ page }) => {
  await mock(page, "/__mock/reset");
});

test("onboarding: connect everything, choose the database, confirm the time zone", async ({ page }) => {
  await logInAs(page, CASEY);
  await expect(page.getByRole("heading", { name: "Connect Notion" })).toBeVisible();
  await expect(page.getByText("Step 1 of 6")).toBeVisible();

  await page.getByRole("link", { name: "Connect Notion", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Notion is connected." })).toBeVisible();
  // Setup moves on to the first unfinished step by itself.
  await expect(page.getByRole("heading", { name: "Connect YouTube" })).toBeVisible();

  await page.getByRole("link", { name: "Connect YouTube", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "YouTube is connected." })).toBeVisible();
  await page.getByRole("link", { name: "Connect Google Drive", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Google Drive is connected." })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Choose your content calendar" })).toBeVisible();
  await page.getByRole("radio", { name: "Content calendar" }).check();
  await page.getByRole("button", { name: "Use this database" }).click();
  // Saved: setup moves on to the time zone step.
  await expect(page.getByRole("heading", { name: "Confirm your time zone" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Done: 4. Choose your content calendar" })).toBeVisible();

  await page.getByLabel("Time zone").selectOption("America/Edmonton");
  await page.getByRole("button", { name: "Confirm time zone" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();

  await page.goto("/dashboard/setup");
  await expect(page.getByRole("heading", { name: "Check your connections" })).toBeVisible();
  await page.getByRole("button", { name: "Check my connections" }).click();
  await expect(page.getByText("You are set up.")).toBeVisible();

  // Connections page shows real names; Overview no longer shows the setup card.
  await page.goto("/dashboard/connections");
  await expect(card(page, "notion")).toContainText("Creator Studio");
  await expect(card(page, "youtube")).toContainText("Creator Studio Channel");
  await expect(card(page, "google_drive")).toContainText("casey.drive@example.com");
  for (const p of ["notion", "youtube", "google_drive"]) await expect(card(page, p)).toHaveAttribute("data-status", "connected");
  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "Setup" })).toHaveCount(0);

  // Tokens never reach the browser.
  const state = await (await page.request.get(`${MOCK}/__mock/state`)).json();
  expect(state.secrets.length).toBe(3);
  for (const path of ["/dashboard/connections", "/dashboard/setup", "/dashboard"]) {
    const html = await (await page.request.get(path)).text();
    expect(html).not.toMatch(/notion-access-|google-access-|google-refresh-|notion-refresh-/);
  }
});

test("another customer sees none of it", async ({ page }) => {
  await logInAs(page, CASEY, "/dashboard/connections");
  await card(page, "notion").getByRole("link", { name: "Connect Notion", exact: true }).click();
  await expect(card(page, "notion")).toHaveAttribute("data-status", "connected");
  await page.context().clearCookies();

  await logInAs(page, NICO, "/dashboard/connections");
  for (const p of ["notion", "youtube", "google_drive"]) await expect(card(page, p)).toHaveAttribute("data-status", "not_connected");
  await expect(page.getByText("Creator Studio")).toHaveCount(0);
});

test("cancelling on Notion's screen is explained", async ({ page }) => {
  await mock(page, "/__mock/config", { notionDeny: true });
  await logInAs(page, CASEY, "/dashboard/connections");
  await card(page, "notion").getByRole("link", { name: "Connect Notion", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "You cancelled the Notion connection." })).toBeVisible();
  await expect(card(page, "notion")).toHaveAttribute("data-status", "not_connected");
});

test("unticking a Google permission shows a permission problem with Reconnect", async ({ page }) => {
  await mock(page, "/__mock/config", { googleScopes: "partial" });
  await logInAs(page, CASEY, "/dashboard/connections");
  await card(page, "youtube").getByRole("link", { name: "Connect YouTube", exact: true }).click();
  await expect(card(page, "youtube")).toHaveAttribute("data-status", "permission_problem");
  await expect(card(page, "youtube")).toContainText("Permission problem");
  await expect(card(page, "youtube")).toContainText("leave every box ticked");

  // Reconnecting with every box ticked fixes it.
  await mock(page, "/__mock/config", { googleScopes: "all" });
  await card(page, "youtube").getByRole("link", { name: "Reconnect YouTube", exact: true }).click();
  await expect(card(page, "youtube")).toHaveAttribute("data-status", "connected");
});

test("a Google account without a YouTube channel is flagged", async ({ page }) => {
  await mock(page, "/__mock/config", { noChannel: true });
  await logInAs(page, CASEY, "/dashboard/connections");
  await card(page, "youtube").getByRole("link", { name: "Connect YouTube", exact: true }).click();
  await expect(card(page, "youtube")).toHaveAttribute("data-status", "permission_problem");
  await expect(card(page, "youtube")).toContainText("does not have a YouTube channel");
});

test("access removed on the service's side shows a connection error", async ({ page }) => {
  await logInAs(page, CASEY, "/dashboard/connections");
  await card(page, "google_drive").getByRole("link", { name: "Connect Google Drive", exact: true }).click();
  await expect(card(page, "google_drive")).toHaveAttribute("data-status", "connected");

  await mock(page, "/__mock/config", { rejectTokens: true });
  await card(page, "google_drive").getByRole("button", { name: "Check connection" }).click();
  await expect(card(page, "google_drive")).toHaveAttribute("data-status", "error");
  await expect(card(page, "google_drive")).toContainText("has expired or was removed. Reconnect");
  await expect(card(page, "google_drive").getByRole("link", { name: "Reconnect Google Drive", exact: true })).toBeVisible();
});

test("forged or replayed return links are refused", async ({ page }) => {
  await logInAs(page, CASEY, "/dashboard/connections");
  await page.goto("/api/connect/youtube/callback?code=stolen-code&state=forged-state");
  await expect(page).toHaveURL(/\/dashboard\/connections\?connectError=link_expired/);
  await expect(page.getByRole("alert").filter({ hasText: "expired or was already used" })).toBeVisible();
  await expect(card(page, "youtube")).toHaveAttribute("data-status", "not_connected");
});

test("signed-out visitors cannot start a connection", async ({ page }) => {
  await page.goto("/api/connect/notion/start");
  await expect(page).toHaveURL(/\/login/);
});

test("disconnecting removes access, the stored token and the chosen database", async ({ page }) => {
  await logInAs(page, CASEY, "/dashboard/connections");
  await card(page, "notion").getByRole("link", { name: "Connect Notion", exact: true }).click();
  await page.getByRole("radio", { name: "Content calendar" }).check();
  await page.getByRole("button", { name: "Use this database" }).click();
  await expect(page.getByText("Selected: Content calendar")).toBeVisible();

  await card(page, "notion").getByRole("button", { name: "Disconnect" }).click();
  await expect(card(page, "notion")).toContainText("Your chosen database will be cleared.");
  await card(page, "notion").getByRole("button", { name: "Yes, disconnect Notion" }).click();
  await expect(card(page, "notion")).toHaveAttribute("data-status", "not_connected");
  await expect(page.getByText("Selected: Content calendar")).toHaveCount(0);

  const state = await (await page.request.get(`${MOCK}/__mock/state`)).json();
  expect(state.secrets).toEqual([]);
  expect(state.dataSources).toEqual([]);
});
