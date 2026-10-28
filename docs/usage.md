# Using Friction Timer

## Installation and updates

Download the APK from [this fork's releases](https://github.com/Today20092/FrictionTimer/releases). The published build targets ARM64 devices running Android 7 or newer. Android may ask you to allow installation from your browser or file manager.

Future releases use the same signing key and can update this fork's release builds in place. Upstream APKs and debug builds may use different keys. Android refuses an in-place update when signatures differ. Keep your current install if you need its settings; uninstalling deletes the app's local data. There is no configuration export/import feature.

## Permissions

Enable Display over other apps and the Accessibility service so the app can detect selected apps and show the waiting overlay. Notifications are needed only for optional session reminders. If permission is missing, the app explains how to open settings.

The home screen hides the permissions section when all three permissions are enabled. It checks again when you return to the app.

## Add an app

Recommended apps are installed feed apps you have not configured yet. The list covers Facebook, Instagram, TikTok, YouTube, X, Mastodon, Threads, Bluesky, Reddit, and Snapchat, using known Android package names. Some regional and modified TikTok/YouTube packages are included; other clients may need **Add any app**.

Tap a recommendation to open setup. Its row is selected and brought into view. Nothing starts blocking until you save. If no recommendations apply, the section is hidden.

Choose the waiting time, session duration, and messages. A finite duration sets how long the app stays unlocked. With unlimited duration, returning within the **Return window (seconds)** skips another wait, so you can briefly switch apps to copy something or multitask. Set this separately for each app in its Timing step. The default is 30 seconds; use 0 to disable it, or choose a whole number up to 2,147,483,647 seconds. Existing saved apps receive the 30-second default when updated. Turning off the screen clears return windows. The window starts after you complete the wait and leave the app; leaving an unfinished countdown does not unlock it. The editor keeps Cancel/Next/Save reachable, with scrolling inside long lists or content when necessary.

## Manage defaults

Open **Manage defaults** to choose which settings new apps inherit. Enable **Use a default return window** and enter the seconds below it; 0 requires a new wait after leaving. Return windows apply to unlimited sessions. You can copy the value from a saved app and save it alongside your other defaults.

Saving defaults does not change existing apps. Select the apps under **Apply to existing apps**, then confirm applying the saved settings. Unticked defaults leave those settings unchanged, so you can apply just the return window without changing waits, durations, messages, or reminders. Existing defaults are preserved when updating to v2.3.1; the new return-window default stays unticked until you choose it.

## Session reminders

Reminders are off by default for every app. Enable them individually and choose a positive whole-minute interval; the initial value is 10 minutes.

The timer counts foreground use after you press Proceed, or immediately if no wait is needed. Waiting on the overlay does not count. Quiet notifications repeat at each interval, showing total time for that visit: 10, 20, 30 minutes, for example. One notification is updated rather than creating a growing stack.

Leaving the app or turning off the screen resets the timer and clears its notification. Returning starts a new visit. Known transient system windows pause timing; delivery still depends on Android and your device's notification settings. The notification does not block the app.

## Edit, delete, and recover

Open a configured app to edit its settings. Delete asks for confirmation. Loading and saving errors provide feedback and retry paths; changing steps or retrying keeps the draft. Correct invalid timing fields before continuing.

## Privacy

Configuration is stored locally in the app's database. Session reminders use current-session timing; this feature does not store usage history or add analytics. The Accessibility service observes foreground app changes to apply your configured rules. Installed app discovery supplies the picker and recommendations.

The GitHub repository link opens an external website. Android's own notification, accessibility, and battery settings can affect operation.

## Appearance

Supported Android 12+ devices use system dynamic Material colors. Colors refresh when the settings screen becomes visible again. Other devices retain the gold-and-charcoal palette. The hourglass stays gold; supported launchers can recolor its monochrome themed icon.
