# Recommend feed apps and add optional session reminders

## Why

It is easy to open a feed without thinking and keep scrolling. Friction Timer should help people notice that habit, choose which apps need a pause, and get a reminder when a visit lasts longer than they intended. People can still use social media to create, find ideas, or enjoy what others share.

## Scope

Add a visible recommended-apps section on the home screen and optional reminders for the current visit to any configured app.

## Acceptance criteria

### Recommended apps

- Show a "Recommended apps" section above configured apps on the home screen.
- Start with TikTok, Facebook, Instagram, X/Twitter, and YouTube. Identify apps by their Android package IDs rather than their display names.
- Only show recommendations that are installed and not already configured.
- Hide the section when there are no eligible apps.
- Keep "Add any app" available so users can choose apps outside this list.
- Tapping a recommendation opens the existing setup flow for that app. It does not automatically configure or block the app.
- Refresh recommendations after an app is configured or removed from the configured list.

### Reminder settings

- Offer optional reminders for each configured app, including apps chosen through "Add any app."
- Keep reminders off by default, including for existing configurations.
- When enabled, default the interval to 10 minutes and allow a positive whole number of minutes.
- Save the enabled state and interval per app and restore them after restarting Friction Timer.
- Validate the interval at the persistence boundary as well as in the form.

### Session timing and notifications

- Count only time spent using the configured app in the foreground.
- Start timing after the user proceeds past the waiting overlay, or immediately when the app requires no wait. Exclude time spent waiting.
- At each interval, show total minutes for the current visit. With a 10-minute interval, reminders say "You've been on TikTok for 10 minutes," then 20 minutes, then 30 minutes.
- Deliver quiet Android notifications without blocking app interaction. Update the same notification rather than accumulating notifications.
- Reset the timer and clear its notification when the user switches away from the app or turns off the screen. Returning starts a new visit.
- The reminder notification itself must not reset the session or trigger a new waiting overlay.
- Stop reminders and clear their notification when reminders are disabled, the configuration is removed, or the tracking service stops. Do not send catch-up reminders after restarting the service.
- If notification permission is missing, explain why reminders cannot appear and provide a way to enable notifications in settings. App selection and waiting overlays remain usable.
- Store reminder preferences only. Do not persist session durations, usage history, or analytics.

## Implementation boundaries

Use the existing app discovery, setup, persistence, and foreground-session flows. Keep TypeScript, Rust, and Kotlin payloads aligned. Preserve existing configurations when adding reminder fields, with reminders disabled for old records. Keep duration units explicit across bridges.

Android package matching, notification permission and channel handling, and foreground-session effects need implementation review. The five named apps are the initial recommendation list; automatic feed detection is outside this ticket.

## Verification

- Verify recommendations for installed, absent, configured, and newly removed configurations, including an empty section.
- Verify both recommended apps and "Add any app" reach the existing setup flow.
- Verify reminder defaults, saved preferences, invalid intervals, and migration of existing configurations.
- Cover interval boundaries, repeated reminders, waiting-time exclusion, app switching, screen-off, and session reset in focused logic tests.
- On an Android device or emulator, verify notification permission granted and denied, quiet notification updates, notification cleanup, and service restart behavior.
- Recheck countdown and proceed, cancel, leaving and re-entering an app, cooldown expiry, and permission changes for regressions.
- Run the frontend build, Rust tests and formatting check, and Android JVM tests for the affected layers. Report device behavior separately from automated results.

## Not included

Usage dashboards, daily totals, stored usage history, automatic blocking of recommendations, automatic feed detection, and changes to the existing waiting-period or cooldown behavior.
