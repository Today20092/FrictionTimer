import type { InstalledApp } from "./types";

const FEED_PACKAGES = new Set([
  "com.zhiliaoapp.musically", "com.ss.android.ugc.trill",
  "com.facebook.katana", "com.instagram.android", "com.twitter.android",
  "com.google.android.youtube",
  "app.morphe.android.youtube", "app.revanced.android.youtube",
  "org.joinmastodon.android", "com.instagram.barcelona", "xyz.blueskyweb.app",
  "com.reddit.frontpage", "com.snapchat.android",
]);

export function recommendedApps(installed: InstalledApp[], configured: { appId: string }[]): InstalledApp[] {
  const covered = new Set(configured.map(app => app.appId));
  return installed.filter(app => FEED_PACKAGES.has(app.appId) && !covered.has(app.appId));
}
