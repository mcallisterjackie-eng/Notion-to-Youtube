import { expect, test, type Page } from "@playwright/test";

const PAT = { email: "pw-change@example.com", password: "old-password-123", name: "Pat Change" };
const GOOGLE = { email: "google-user@example.com", password: "test-only-google-standin" };

async function logInAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/dashboard");
  await page.goto("/dashboard/profile");
}

const personal = (page: Page) => page.getByRole("region", { name: "Personal details" });
const passwordPanel = (page: Page) => page.getByRole("region", { name: "Password" });
const prefs = (page: Page) => page.getByRole("region", { name: "Preferences" });

test.describe.configure({ mode: "serial" });

test("name changes are saved and shown everywhere", async ({ page }) => {
  await logInAs(page, PAT.email, PAT.password);
  const name = personal(page).getByRole("textbox", { name: "Name" });
  await name.fill("Patricia   Change");
  await personal(page).getByRole("button", { name: "Save changes" }).click();
  await expect(personal(page).getByRole("status")).toHaveText("Saved");
  await page.reload();
  await expect(personal(page).getByRole("textbox", { name: "Name" })).toHaveValue("Patricia Change");
  await expect(page.locator(".app-user")).toContainText("Patricia Change");

  // Restore for the next run.
  await personal(page).getByRole("textbox", { name: "Name" }).fill(PAT.name);
  await personal(page).getByRole("button", { name: "Save changes" }).click();
  await expect(personal(page).getByRole("status")).toHaveText("Saved");
});

test("an empty name is refused with a clear message", async ({ page }) => {
  await logInAs(page, PAT.email, PAT.password);
  const name = personal(page).getByRole("textbox", { name: "Name" });
  await name.fill("   ");
  // Bypass the browser's own "required" check to reach the server rule.
  await name.evaluate((el) => el.removeAttribute("required"));
  await personal(page).getByRole("button", { name: "Save changes" }).click();
  await expect(personal(page).locator(".form-error")).toHaveText("Enter your name.");
});

test("time zone is saved to the account", async ({ page }) => {
  await logInAs(page, PAT.email, PAT.password);
  const select = prefs(page).getByLabel("Time zone");
  await expect(select).toHaveValue("UTC");
  await select.selectOption("America/Edmonton");
  await prefs(page).getByRole("button", { name: "Save preferences" }).click();
  await expect(prefs(page).getByRole("status")).toHaveText("Saved");
  await page.reload();
  await expect(prefs(page).getByLabel("Time zone")).toHaveValue("America/Edmonton");

  await prefs(page).getByLabel("Time zone").selectOption("UTC");
  await prefs(page).getByRole("button", { name: "Save preferences" }).click();
  await expect(prefs(page).getByRole("status")).toHaveText("Saved");
});

test("changing email asks for confirmation and does not change it yet", async ({ page }) => {
  await logInAs(page, PAT.email, PAT.password);
  await personal(page).getByRole("textbox", { name: "Email" }).fill("pat-new@example.com");
  await personal(page).getByRole("button", { name: "Save changes" }).click();
  await expect(personal(page).getByRole("status")).toContainText("Check pat-new@example.com for a confirmation link");
  await page.reload();
  await expect(personal(page).getByRole("textbox", { name: "Email" })).toHaveValue(PAT.email);
});

test("password change checks the current password first", async ({ page }) => {
  await logInAs(page, PAT.email, PAT.password);
  await passwordPanel(page).getByLabel("Current password").fill("wrong-password");
  await passwordPanel(page).getByLabel("New password").fill("brand-new-password");
  await passwordPanel(page).getByRole("button", { name: "Update password" }).click();
  await expect(passwordPanel(page).locator(".form-error")).toHaveText("Your current password is not right.");

  await passwordPanel(page).getByLabel("Current password").fill(PAT.password);
  await passwordPanel(page).getByLabel("New password").fill("brand-new-password");
  await passwordPanel(page).getByRole("button", { name: "Update password" }).click();
  await expect(passwordPanel(page).getByRole("status")).toHaveText("Password updated");

  // The new password works; then put the old one back for the next run.
  await page.context().clearCookies();
  await logInAs(page, PAT.email, "brand-new-password");
  await passwordPanel(page).getByLabel("Current password").fill("brand-new-password");
  await passwordPanel(page).getByLabel("New password").fill(PAT.password);
  await passwordPanel(page).getByRole("button", { name: "Update password" }).click();
  await expect(passwordPanel(page).getByRole("status")).toHaveText("Password updated");
});

test("people who sign in with Google have no password to change", async ({ page }) => {
  await logInAs(page, GOOGLE.email, GOOGLE.password);
  await expect(passwordPanel(page)).toContainText("You sign in with Google");
  await expect(passwordPanel(page).getByLabel("Current password")).toHaveCount(0);
});

test("account deletion is not available yet", async ({ page }) => {
  await logInAs(page, PAT.email, PAT.password);
  await expect(page.getByRole("button", { name: "Delete account" })).toBeDisabled();
});
