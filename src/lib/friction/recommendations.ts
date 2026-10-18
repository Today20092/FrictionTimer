import type { InstalledApp } from "./types";

const FEED_PACKAGES = new Set([
  "com.zhiliaoapp.musically", "com.ss.android.ugc.trill",
  "com.facebook.katana", "com.instagram.android", "com.twitter.android",
  "com.google.android.youtube",
]);

export function recommendedApps(installed: InstalledApp[], configured: { appId: string }[]): InstalledApp[] {
  const covered = new Set(configured.map(app => app.appId));
  return installed.filter(app => FEED_PACKAGES.has(app.appId) && !covered.has(app.appId));
}
