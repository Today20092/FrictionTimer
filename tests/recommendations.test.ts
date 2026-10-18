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
console.log("Recommendation filtering, package matching and removed configurations passed");
