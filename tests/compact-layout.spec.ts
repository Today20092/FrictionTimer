import { expect, test, type Page } from "@playwright/test";
import { mockNativeBridge } from "./native-bridge";

async function expectSinglePage(page: Page) {
  const size = await page.evaluate(() => ({
    width: innerWidth, height: innerHeight,
    pageWidth: document.documentElement.scrollWidth,
    pageHeight: document.documentElement.scrollHeight,
  }));
  expect(size.pageWidth).toBeLessThanOrEqual(size.width + 1);
  expect(size.pageHeight).toBeLessThanOrEqual(size.height + 1);
  const actions = page.locator('[data-slot="editor-actions"]');
  if (await actions.count()) {
    const bounds = await actions.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(size.height + 1);
  }
}

for (const viewport of [{ width: 384, height: 783 }, { width: 320, height: 568 }, { width: 1280, height: 800 }]) {
  test(`editor keeps actions on screen at ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const native = await mockNativeBridge(page);
    native.installed.push(...Array.from({ length: 30 }, (_, index) => ({ appId: `com.example.app${index}`, name: `App ${index}` })));
    await page.goto("/app/new");
    await expect(page.getByRole("radio", { name: "Notes", exact: true })).toBeVisible();
    await expectSinglePage(page);
    await page.screenshot({ path: test.info().outputPath("app-picker.png") });
    await page.getByRole("radio", { name: "Notes", exact: true }).check();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("switch", { name: "Session reminders", exact: true }).check();
    await expectSinglePage(page);
    if (viewport.height === 783) {
      const content = page.locator('[data-slot="editor-content"]');
      expect(await content.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
    }
    await page.screenshot({ path: test.info().outputPath("timing.png") });
    await page.getByRole("button", { name: "Next" }).click();
    await expectSinglePage(page);
    await page.getByLabel("Message 1", { exact: true }).fill("A long reminder ".repeat(150));
    await expectSinglePage(page);
    await expect(page.getByRole("button", { name: "Create", exact: true })).toBeInViewport();
    await page.screenshot({ path: test.info().outputPath("messages.png") });
  });
}

test("home hides enabled permissions, restores revoked ones and links to the fork", async ({ page }) => {
  await page.setViewportSize({ width: 384, height: 783 });
  const native = await mockNativeBridge(page);
  native.installed.push(
    { appId: "org.joinmastodon.android", name: "Mastodon" },
    { appId: "com.facebook.katana", name: "Facebook" },
    { appId: "com.zhiliaoapp.musically", name: "TikTok" },
    { appId: "com.google.android.youtube", name: "YouTube" },
    { appId: "com.twitter.android", name: "X" },
    { appId: "com.instagram.barcelona", name: "Threads" },
    { appId: "xyz.blueskyweb.app", name: "Bluesky" },
    { appId: "com.reddit.frontpage", name: "Reddit" },
    { appId: "com.snapchat.android", name: "Snapchat" },
  );
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Mastodon", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Permissions", exact: true })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "GitHub repository", exact: true })).toHaveAttribute("href", "https://github.com/Today20092/FrictionTimer");
  await expect(page.getByText("Made by", { exact: false })).not.toBeVisible();
  await expectSinglePage(page);
  await page.screenshot({ path: test.info().outputPath("home.png") });
  native.permissions.notifications = false;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("button", { name: "Session reminder notifications Set up" })).toBeVisible();
  native.permissions.notifications = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("heading", { name: "Permissions", exact: true })).not.toBeVisible();
});

test("enlarged text and a short viewport keep editor actions reachable", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 420 });
  await mockNativeBridge(page);
  await page.goto("/app/saved-app");
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeVisible();
  await page.evaluate(() => { document.documentElement.style.fontSize = "20px"; });
  await expectSinglePage(page);
  await page.getByRole("button", { name: "Next" }).click();
  await expectSinglePage(page);
});
