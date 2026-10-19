import assert from "node:assert/strict";
import { recommendedApps } from "../src/lib/friction/recommendations.ts";

const installed = [
  { appId: "com.instagram.android", name: "Instagram" },
  { appId: "com.google.android.youtube", name: "YouTube" },
  { appId: "other.app", name: "TikTok" },
];
assert.deepEqual(recommendedApps(installed, [{ appId: "com.instagram.android" }]), [installed[1]]);
assert.deepEqual(recommendedApps([], []), []);
assert.deepEqual(recommendedApps(installed, []).map(app => app.appId), ["com.instagram.android", "com.google.android.youtube"]);
const additionalFeeds = [
  { appId: "org.joinmastodon.android", name: "Mastodon" },
  { appId: "com.instagram.barcelona", name: "Threads" },
  { appId: "xyz.blueskyweb.app", name: "Bluesky" },
  { appId: "com.reddit.frontpage", name: "Reddit" },
  { appId: "com.snapchat.android", name: "Snapchat" },
  { appId: "app.morphe.android.youtube", name: "YouTube" },
  { appId: "app.revanced.android.youtube", name: "YouTube" },
];
assert.deepEqual(recommendedApps(additionalFeeds, []), additionalFeeds);
assert.deepEqual(recommendedApps(additionalFeeds, [{ appId: "org.joinmastodon.android" }]), additionalFeeds.slice(1));
console.log("Recommendation filtering, package matching and removed configurations passed");
