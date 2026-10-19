# Verification and review

Implemented against [the spec](spec.md) on `codex/recommended-apps-reminders`. The feature is in the separate checkout `C:/Users/User/.codex/worktrees/friction-reminders-integration` because concurrent uncommitted edits overlap the primary checkout. Those edits were preserved, and the primary checkout remains on `codex/brand-theme-and-app-settings`.

## Automated checks

- `pnpm build` passed.
- `node tests/recommendations.test.ts` passed, covering installed and configured filtering, removal, empty results, and package identity.
- Mocked browser checks passed for recommendation setup, default reminder settings, validation recovery, and mobile layout without horizontal overflow or page errors. These served the implementation checkout.
- `cargo test --manifest-path src-tauri/Cargo.toml` passed all 16 tests, including saved reminder preferences, migration defaults, and interval validation.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` passed.
- From `src-tauri/gen/android`, `./gradlew.bat :app:testArmDebugUnitTest --console=plain` passed all 13 tests across three suites. Kotlin and the Android manifest compiled.
- `pnpm tauri android build --debug --target aarch64 --apk` passed after review fixes. The build also reran the frontend production build. It used JDK 21, Android SDK at the machine's usual local SDK directory, and NDK 28.2.13676358.
- Diff whitespace validation passed. Existing Gradle and Java source/target deprecation warnings remain.

## Standards review

The independent Standards reviewer found no documented-rule violations or actionable structural smells. It found one compatibility issue: notification settings used an action introduced in API 26, although the app supports API 24. Commit `8dce384` adds the app-details settings fallback for Android 7. The reviewer rechecked the fix and found no remaining actionable issue there.

The Android API introduction is documented in the [Settings reference](https://developer.android.com/reference/android/provider/Settings#ACTION_APP_NOTIFICATION_SETTINGS).

## Spec review

The independent Spec reviewer found that an unresolved foreground could keep a previous app's reminder session running. Commit `8dce384` ends the session when the foreground is unknown, while positively identified transient system windows pause timing and notification delivery. Resuming excludes paused time. Unlimited sessions can resume reminder timing without a new waiting overlay. Focused tests cover these decisions. The reviewer rechecked the fix and reported no remaining blocker for its finding.

Review totals: one correctness finding from Standards and one from Spec, both resolved.

## Android device smoke test

On the connected Samsung device running API 37, the final debug APK installed as an update without clearing app data.

- The existing configured app remained present and was excluded from recommendations. Eligible installed feed apps appeared above configured apps.
- Native reminder settings showed reminders off initially and a 10-minute interval when enabled.
- The missing-notification explanation opened the correct Android notification settings screen. Enabling permission was reflected by the native status bridge.
- A temporary Calculator configuration used a one-second wait, an unlimited session, and a one-minute reminder interval, created through the public Tauri persistence command. A preliminary temporary Settings entry was removed because Samsung Settings declares a fallback HOME activity and the existing app filter excludes HOME packages.
- Calculator showed the waiting overlay. Proceed and Cancel worked.
- Proceed occurred at 19:53:44.788 local time on October 18, 2026. Android's notification record showed first creation at 19:54:45.684, about 61 seconds later.
- That same notification, ID 1001, updated with total elapsed minutes. At 19:58:45.307 it read "You've been on Calculator for 5 minutes."
- Android reported LOW importance, no sound, and vibration disabled.
- Leaving Calculator removed the notification. Returning showed a new waiting overlay, and Cancel returned to the launcher.
- Both temporary configurations were deleted through the public persistence command. Notification permission was restored to its original disabled state, the temporary debug port forwarding was removed, and device-side captures were removed.

UIAutomator dumps temporarily suppress accessibility services on this device. Runtime overlay checks therefore used screenshots and notification records after UI inspection finished.

## Remaining coverage limits

Screen-off timing, unknown/transient foreground behavior, and configuration removal are covered by focused logic tests and code review. A complete device matrix for screen-off/re-entry, service interruption, cooldown expiry, and permission revocation during an active reminder was not exercised. The Android 7 settings fallback was statically reviewed, not tested on Android 7 hardware.

Recommendations match explicit package IDs. Repackaged or custom variants need a package-list update; disabled apps follow existing installed-app discovery behavior. No usage history or analytics were added.

## Combined APK update

At the user's request, merge `80de684` combined workflow improvements `9cc3697` and `ad74278` with recommendations and reminders. Both commits were verified as ancestors of the combined build. Editor conflicts were resolved to retain delete confirmation, retry recovery, native form validation, app identity, recommendation preselection, and reminder settings. Integration checks also cover saving and reopening reminders and notification-settings error recovery.

The combined frontend build, recommendation assertions, and all 12 Playwright tests passed. No Android or Rust runtime code changed in this merge. A new aarch64 debug APK built successfully and installed on the connected phone using `adb install -r`.

The installed APK's SHA-256 matched the newly built APK. Before and after the update, a fingerprint of the complete saved configurations matched, with one existing entry preserved. Native overlay and accessibility status remained enabled. Temporary debug port forwarding was removed after verification.
