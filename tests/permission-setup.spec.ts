import { test, expect } from "@playwright/test";
import { mockNativeBridge } from "./native-bridge";

test("first run explains skipped permissions and remembers completion", async ({ page }) => {
  const state = await mockNativeBridge(page, true);
  state.permissions = { overlay: false, accessibility: false, notifications: false };
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Show the pause screen" })).toBeVisible();
  await expect(page.getByText("Without this, the pause screen cannot appear", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page.getByRole("heading", { name: "Notice when a selected app opens" })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page.getByText("Optional", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page.getByText("Pauses will not work yet.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Go to home" }).click();
  await expect(page.getByRole("heading", { name: "Permissions", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Show the pause screen" })).toHaveCount(0);
});

test("settings errors can be retried and returning refreshes actual permission", async ({ page }) => {
  const state = await mockNativeBridge(page, true);
  state.permissions = { overlay: false, accessibility: true, notifications: true };
  state.failures.add("open_service_settings");
  await page.goto("/");
  await page.getByRole("button", { name: "Open Android settings" }).click();
  await expect(page.getByRole("alert")).toContainText("Couldn’t open Android settings");
  state.failures.clear();
  state.permissions.overlay = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("status")).toHaveText("Enabled");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Pauses are ready.", { exact: false })).toBeVisible();
});
