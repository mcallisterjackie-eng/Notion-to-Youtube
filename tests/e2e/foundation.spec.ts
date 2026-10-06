import { expect, test, type Page } from "@playwright/test";

const USER = { email: "creator@example.com", password: "correct-horse-battery", name: "Riley Morgan" };
const NAV = ["Overview", "My Profile", "Analytics", "Billing", "Connections", "Field Mapping"];

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page should not scroll sideways").toBeLessThanOrEqual(0);
}

async function logIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(USER.email);
  await page.getByLabel("Password").fill(USER.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/dashboard");
}

/** On small screens the navigation panel sits behind the menu button. */
async function openNavIfCollapsed(page: Page) {
  const toggle = page.getByRole("button", { name: "Open menu" });
  if (await toggle.isVisible()) await toggle.click();
}

test.describe("public site", () => {
  test("home page shows the branded shell and the $12 plan", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("img", { name: "The Systems Design Lab" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("$12", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/thumbnail/i)).toHaveCount(0);
    await expectNoHorizontalScroll(page);
  });

  for (const path of ["/products", "/videos", "/about", "/contact", "/privacy", "/terms"]) {
    test(`${path} renders without sideways scrolling`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoHorizontalScroll(page);
    });
  }

  test("unknown pages show the branded not-found page", async ({ page }) => {
    const res = await page.goto("/no-such-page");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This experiment did not work out" })).toBeVisible();
  });
});

test.describe("sign-in pages", () => {
  test("log in, sign up and reset pages render", async ({ page }) => {
    for (const [path, heading] of [
      ["/login", "Log in"],
      ["/signup", "Create your account"],
      ["/forgot-password", "Reset your password"],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expectNoHorizontalScroll(page);
    }
  });

  test("Google sign-in appears when it is switched on in Supabase", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await page.goto("/signup");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  });

  test("a wrong password shows a plain-English error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(USER.email);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.locator(".form-error")).toHaveText(/do not match/);
    await expect(page).toHaveURL(/\/login/);
  });

  test("sign-up asks the person to confirm their email", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Name").fill("New Creator");
    await page.getByLabel("Email").fill("new@example.com");
    await page.getByLabel("Password").fill("a-long-password");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
    await expect(page.getByText("new@example.com")).toBeVisible();
  });

  test("a failed or expired email link lands on log in with an explanation", async ({ page }) => {
    await page.goto("/auth/callback?error=access_denied&error_description=Email+link+is+invalid+or+has+expired");
    await expect(page).toHaveURL(/\/login\?error=callback/);
    await expect(page.locator(".form-error")).toHaveText(/expired or was already used/);
  });

  test("the reset-password page needs a valid reset link", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "This link has expired" })).toBeVisible();
  });
});

test.describe("protected dashboard", () => {
  test("signed-out visitors are sent to log in, remembering the page", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fbilling$/);
  });

  test("open redirects are refused after sign-in", async ({ page }) => {
    await page.goto("/login?next=//evil.example");
    await page.getByLabel("Email").fill(USER.email);
    await page.getByLabel("Password").fill(USER.password);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL("**/dashboard");
  });

  test("log in, use the navigation, log out", async ({ page }) => {
    await logIn(page);
    await expect(page.getByText(USER.name).first()).toBeAttached();
    await expect(page.getByRole("note")).toContainText("sample data");
    await expect(page.getByRole("heading", { name: /Riley/ })).toBeVisible();

    for (const label of NAV) {
      await openNavIfCollapsed(page);
      await page.getByRole("navigation", { name: "Dashboard" }).getByRole("link", { name: label, exact: true }).click();
      await expect(page.getByRole("heading", { level: 1, name: label === "Overview" ? /Riley/ : label })).toBeVisible();
      await expectNoHorizontalScroll(page);
    }

    // Signed-in people skip the sign-in pages.
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);

    await openNavIfCollapsed(page);
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login\?signedOut=1/);
    await expect(page.getByRole("status")).toHaveText("You have been logged out.");

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });

  test("a signed-in visitor returns to the page they asked for", async ({ page }) => {
    await page.goto("/dashboard/connections");
    await page.getByLabel("Email").fill(USER.email);
    await page.getByLabel("Password").fill(USER.password);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL("**/dashboard/connections");
    await expect(page.getByRole("heading", { level: 1, name: "Connections" })).toBeVisible();
  });

  test("the profile page shows the signed-in person, not sample data", async ({ page }) => {
    await logIn(page);
    await page.goto("/dashboard/profile");
    await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(USER.name);
    await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue(USER.email);
    await expect(page.getByText("Jordan Lee")).toHaveCount(0);
  });

  test("navigation labels use title case", async ({ page }) => {
    await logIn(page);
    await openNavIfCollapsed(page);
    const labels = await page.getByRole("navigation", { name: "Dashboard" }).getByRole("link").allInnerTexts();
    expect(labels.map((l) => l.trim())).toEqual(NAV);
  });
});
