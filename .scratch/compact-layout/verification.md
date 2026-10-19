# Compact screens and home cleanup

Implemented in `cd4fbbe` on `codex/recommended-apps-reminders` and installed on the connected phone as an APK update.

## Changes

- Edit and new-app screens use the available viewport height, with compact step indicators and a separate navigation row. App selection, timing, and messages share a bounded content area.
- Reduced header, form, card, and section spacing without shrinking normal input text or the 44-pixel primary touch controls. Numeric range hints remain available to assistive technology. Large or long content can scroll within the content area rather than hiding navigation.
- Positioned radio and switch form controls within their containers so their hidden native inputs cannot extend the document beyond the viewport.
- Recommendations use a two-column grid and recognize Facebook, Instagram, TikTok, YouTube, X, Mastodon, Threads, Bluesky, Reddit, and Snapchat. TikTok regional packages and observed/common YouTube variants are included. Only installed, unconfigured matches appear.
- The entire home permission section, including its separator, is hidden after all three permissions are successfully verified as enabled. It returns after a revoked permission or status-check failure. Focus and visibility refresh behavior is preserved.
- Replaced the home footer credit with a link to the verified Git origin, `https://github.com/Today20092/FrictionTimer`. Existing external-link handling is reused; source credits and license remain intact.

## Verification

- Frontend production build and recommendation assertions passed.
- All 16 browser tests passed, including four new layout/permission tests and the existing workflow and reminder tests. An additional desktop viewport case then passed separately, for 17 passing cases in the final test set.
- Browser coverage includes 384 × 783, 320 × 568, 1280 × 800, enlarged 20-pixel root text, a short viewport, long messages, a full app inventory, all ten recommendations, and permission revocation/recovery.
- Visually reviewed screenshots of the app picker, complete timing form with reminders enabled, and the home screen with all ten recommendations. The common phone timing state fits without an internal content scroll.
- Android aarch64 debug APK build passed. No Rust or Kotlin behavior changed, so their previously passing suites were not repeated for this UI-only change.
- Installed with `adb install -r`. A before/after fingerprint of the complete saved configurations matched.
- Measured the actual Android WebView at 384 × 783. Home, edit selection, edit timing/messages, new selection, new timing with reminders enabled, and new messages all reported document size 384 × 783, zero horizontal or vertical page overflow, and navigation ending at approximately y=771. The inspected editor content also had zero overflow except for the deliberately scrollable installed-app list.
- Home measurements confirmed the enabled-permissions section was absent and the footer linked to the user's fork. Left the device on Edit application and removed temporary debugging port forwarding and device captures.
- Diff whitespace validation passed. Existing Gradle deprecation warnings remain.

## Limits

Large app inventories, unusually long messages, error explanations, larger text, and smaller screens may need internal scrolling. Content and recovery controls are not clipped to force a fit. Soft-keyboard viewport changes were approximated in browser tests; every Android keyboard and device orientation was not exercised. The native screen used its existing dynamic theme; no color tokens changed.

## References

The layout uses the documented [dynamic viewport height](https://tailwindcss.com/docs/height), [overflow behavior](https://tailwindcss.com/docs/overflow), and [shadcn Field composition](https://ui.shadcn.com/docs/components/field). The shadcn CLI could not run in the context-mode environment because its Node executable path was unavailable; existing components and fetched official documentation were used instead.

Additional canonical package IDs were checked against the official Google Play listings for [Mastodon](https://play.google.com/store/apps/details?id=org.joinmastodon.android), [Threads](https://play.google.com/store/apps/details?id=com.instagram.barcelona), [Bluesky](https://play.google.com/store/apps/details?id=xyz.blueskyweb.app), [Reddit](https://play.google.com/store/apps/details?id=com.reddit.frontpage), and [Snapchat](https://play.google.com/store/apps/details?id=com.snapchat.android). The shortlist is not a numerical popularity ranking.

## Selected-app scrolling follow-up

Commit `73a4100` brings the selected row into view after the asynchronous inventory and selection have rendered. It applies to recommendations, editing, and returning with Back. It uses the documented [nearest alignment](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView) to avoid unnecessary movement, and leaves subsequent manual scrolling alone.

A regression test first reproduced an offscreen Facebook selection, then passed with the fix. The frontend build and all 18 browser tests passed, and the rebuilt APK installed successfully. On the actual phone, Facebook was fully visible within the list after clicking its home recommendation: the list scrolled about 3,069 pixels while the document remained 384 × 783 with no page overflow. Editing and returning with Back were also verified. Saved configurations were unchanged; the device was left on Facebook's new-app setup without saving a new configuration. Temporary debug port forwarding was removed.
