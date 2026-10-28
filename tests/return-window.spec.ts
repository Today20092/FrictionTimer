import { expect, test } from "@playwright/test";
import { mockNativeBridge } from "./native-bridge";

test("return window validates, saves per app and can be disabled", async ({ page }) => {
  const native = await mockNativeBridge(page);
  await page.setViewportSize({ width: 384, height: 783 });
  await page.goto("/app/saved-app");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("switch", { name: "Unlimited duration" }).check();
  const windowInput = page.getByLabel("Return window (seconds)");
  const next = page.getByRole("button", { name: "Next" });
  await expect(windowInput).toHaveValue("30");
  for (const value of ["", "-1", "1.5", "2147483648"]) {
    await windowInput.fill(value);
    await expect(windowInput).toHaveAttribute("aria-invalid", "true");
    await expect(next).toBeDisabled();
  }
  await page.getByRole("switch", { name: "Unlimited duration" }).uncheck();
  await expect(windowInput).not.toBeVisible();
  await expect(next).toBeEnabled();
  await page.getByRole("switch", { name: "Unlimited duration" }).check();
  await expect(windowInput).toHaveValue("30");
  await windowInput.fill("20");
  await expect(next).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath("return-window.png") });
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await next.click();
  await expect(windowInput).toHaveValue("20");
  await next.click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL("/");
  expect(native.apps[0]).toMatchObject({ durationSeconds: 0, returnGraceSeconds: 20 });

  await page.goto("/app/saved-app");
  await next.click();
  await expect(windowInput).toHaveValue("20");
  await windowInput.fill("0");
  await next.click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL("/");
  expect(native.apps[0].returnGraceSeconds).toBe(0);
});

test("new apps save the chosen return window", async ({ page }) => {
  const native = await mockNativeBridge(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Instagram", exact: true }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("switch", { name: "Unlimited duration" }).check();
  await page.getByLabel("Return window (seconds)").fill("60");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL("/");
  expect(native.apps.find(app => app.appId === "com.instagram.android"))
    .toMatchObject({ durationSeconds: 0, returnGraceSeconds: 60 });
});
