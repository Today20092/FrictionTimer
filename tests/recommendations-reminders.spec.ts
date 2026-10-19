import { expect, test } from "@playwright/test";
import { mockNativeBridge } from "./native-bridge";

test("recommended and edited apps scroll into view after the inventory loads", async ({ page }) => {
  const native = await mockNativeBridge(page);
  native.installed.unshift(...Array.from({ length: 40 }, (_, index) => ({
    appId: `com.example.app${index}`, name: `App ${index}`,
  })));
  native.installed.push({ appId: "com.facebook.katana", name: "Facebook" });
  native.delay = 100;
  await page.goto("/");
  await page.getByRole("link", { name: "Facebook", exact: true }).click();
  const facebook = page.getByRole("radio", { name: "Facebook", exact: true });
  await expect(facebook).toBeChecked();
  await expect(facebook).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("button", { name: "Next" })).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(facebook).toBeInViewport({ ratio: 1 });

  await page.goto("/app/saved-app");
  const reader = page.getByRole("radio", { name: "Reader", exact: true });
  await expect(reader).toBeChecked();
  await expect(reader).toBeInViewport({ ratio: 1 });
  const list = reader.locator("xpath=ancestor::div[@aria-busy][1]");
  await list.evaluate(element => { element.scrollTop = 0; });
  await expect(reader).not.toBeInViewport();
});

test("recommended setup preserves timing validation and saves optional reminders", async ({ page }) => {
  const native = await mockNativeBridge(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Instagram", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Instagram", exact: true })).toBeChecked();
  expect(native.apps).toHaveLength(1);
  await page.getByRole("button", { name: "Next" }).click();
  const reminders = page.getByRole("switch", { name: "Session reminders", exact: true });
  await expect(reminders).not.toBeChecked();
  await reminders.check();
  const interval = page.getByLabel("Remind me every (minutes)");
  await expect(interval).toHaveValue("10");
  await interval.fill("1.5");
  await expect(interval).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(interval).toHaveValue("1.5");
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
  await interval.fill("");
  await reminders.uncheck();
  await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();
  await reminders.check();
  await expect(interval).toHaveValue("10");
  await interval.fill("5");
  const seconds = page.getByRole("group", { name: "Wait time" }).getByLabel("Seconds", { exact: true });
  await seconds.fill("");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(seconds).toBeFocused();
  await seconds.fill("1");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Recommended apps" })).not.toBeVisible();
  expect(native.apps.find(app => app.appId === "com.instagram.android")).toMatchObject({
    waitSeconds: 1, reminderEnabled: true, reminderIntervalMinutes: 5,
  });
  await page.getByRole("link", { name: /Instagram/ }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(reminders).toBeChecked();
  await expect(interval).toHaveValue("5");
});

test("notification settings failures preserve permission status and reminder draft", async ({ page }) => {
  const native = await mockNativeBridge(page);
  native.permissions.notifications = false;
  await page.goto("/app/saved-app");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("switch", { name: "Session reminders", exact: true }).check();
  const interval = page.getByLabel("Remind me every (minutes)");
  await interval.fill("3");
  native.failures.add("open_service_settings");
  await page.getByRole("button", { name: "Enable notifications" }).click();
  const failure = page.getByRole("alert").filter({ hasText: "Couldn't open Android settings" });
  await expect(failure).toBeVisible();
  await expect(page.getByText("Notifications are disabled.", { exact: false })).toBeVisible();
  native.failures.delete("open_service_settings");
  await failure.getByRole("button", { name: "Retry" }).click();
  await expect(failure).not.toBeVisible();
  await expect(interval).toHaveValue("3");
});
