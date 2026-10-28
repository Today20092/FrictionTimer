# Friction Timer changes and verification

Completed October 28, 2026.

## Return grace period

After completing an unlimited session's wait, leaving and returning within its configured return window restores access without another countdown. The window starts on confirmed departure, including after a long visit, and resets after each subsequent departure. Each app has an independent window. Turning off the screen clears active sessions and return windows. Leaving an unfinished countdown does not grant access. Existing finite session durations remain unchanged.

The state machine receives monotonic elapsed milliseconds from the Android service. Expired windows are removed before foreground transitions. The editor hint and usage guide explain the behavior. Tests cover expiry at exactly 30 seconds, quick returns, long visits, repeated departures, switching between unlocked apps, screen-off, unfinished countdowns, and existing transient-foreground handling.

The return window is adjustable per app in the Timing step when Unlimited duration is enabled. The default is 30 seconds; 0 disables it. UI and Rust validation require whole seconds from 0 to 2,147,483,647. An additive, idempotent migration introduces friction_apps.return_grace_seconds with a 30-second default, retaining existing data. Kotlin also handles databases without the column during startup. Existing command callers may omit the input and receive the default. Defaults/bulk operations on other settings preserve each app's return window.

## Rust guidelines review

Installed the requested skill globally for Codex using:

```text
npx --yes skills add https://github.com/Today20092/skills/tree/main/skills/engineering/google-rust-guidelines --skill google-rust-guidelines --agent codex --global --yes
```

Read the installed SKILL.md, full rule inventory, and platform qualifications. Reviewed all seven repository-owned Rust sources: build.rs and src/{main,lib,storage,installed_apps,permissions,theme}.rs, plus Cargo configuration, governing instructions, command consumers, Android database access, and relevant tests. These are application-internal APIs, not an independently consumed Rust library. Generated code and third-party dependencies are outside the source review.

### Fixed

- **Meaningful defaults:** SessionReminderDefaults derived a zero-minute interval rejected by persistence validation. Its explicit Default implementation now uses reminders off and the existing 10-minute initial interval.
- **Failure diagnostics:** The shared JSON conversion-error helper always reported column 5, even when default messages came from column 2. Callers now supply the actual column index. Invalid data continues to fail loading rather than being silently replaced.
- **Organization:** Split nested Tauri imports by module and qualify command registrations by their owning modules.
- **Ownership:** The private installed-app bridge now borrows its optional search string. The external Tauri command payload remains unchanged.
- **Simplicity:** Removed the single-use UUID wrapper and use Uuid::new_v4 directly.

The reminder-default and malformed-message regressions were observed failing before their fixes and pass afterward. The adjustable-window follow-up adds backward-compatible storage and command fields. Existing stored settings, dependencies, toolchain requirements, lint policy, and CI remain compatible.

### Full rule inventory coverage

| Inventory section | Assessment |
| --- | --- |
| Organization and formatting | Reviewed all modules and entrypoints; corrected import organization and qualified registrations; used the existing stable formatter. The small Tauri coordination module fits the binding-module exception. |
| Ownership | Reviewed moves, borrows, clones, and bridge state. Borrowed the private query input; owned collections and test clones serve actual ownership needs. No unnecessary Rc/Arc introduced. |
| Inputs, outputs, and domain types | Existing paths and identifiers use borrowed inputs where appropriate; owned deserialized command payloads and Vec results suit the application and JSON consumers. Boolean permission/reminder fields have clear meanings. |
| Traits and conversions | Fixed the invalid Default value. Existing derives, fallible Result conversions, and error variants retain their semantics. No generic APIs or additional traits needed for hypothetical reuse. |
| Naming and accessors | Existing application names and accessors are clear. Removed the redundant UUID helper. No externally visible renames required. |
| Public contracts | Command names and wire fields are preserved. Cross-team non_exhaustive, extra derives, and reusable-library API expansion are unnecessary for these internal application types. No custom operators, collection len APIs, or public const-function promises need changes. |
| Failures, matching, and concurrency | Recoverable storage/plugin failures return Result; validation and transaction rollback remain intact. StorageError already renders underlying failures through Display, as permitted by the Error contract. Startup failure remains fail-fast. Test unwraps serve assertions; no production check-then-unwrap, poisoned-lock recovery, or catch_unwind issue found. |
| Unsafe, macros, and initialization | No repository-owned unsafe code, unstable features, or pre-main constructor initialization. Existing framework macros and derives are appropriate; initialization remains in Tauri setup. |
| Readability and documentation | Removed a redundant wrapper, corrected diagnostic context, and added focused regression tests. Existing chains and concrete application APIs remain readable. No speculative abstraction or documentation boilerplate added. |
| Google platforms | Chromium/Fuchsia build, threading, testing, and synchronization rules are inapplicable. This is an ordinary Android application, not Google's Android platform repository. Preserved its Cargo/Tauri layout and existing release panic=abort configuration. |

References: [requested skill](https://github.com/Today20092/skills/blob/main/skills/engineering/google-rust-guidelines/SKILL.md), [Rust Default](https://doc.rust-lang.org/std/default/trait.Default.html), [Rust Error](https://doc.rust-lang.org/std/error/trait.Error.html), [rusqlite 0.32.1 conversion errors](https://docs.rs/rusqlite/0.32.1/rusqlite/enum.Error.html), and [skills CLI](https://github.com/vercel-labs/skills/blob/main/README.md). Context7 documentation lookup was attempted but its monthly quota was exhausted; official documentation supplied the fallback.

## Verification

| Check | Result |
| --- | --- |
| Android :app:testArmDebugUnitTest | Passed: 20 tests, including 11 foreground-session tests. |
| cargo test --locked --manifest-path src-tauri/Cargo.toml | Passed: 20 tests; binary and documentation targets also passed. |
| cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings | Passed on the Windows host. |
| cargo fmt --manifest-path src-tauri/Cargo.toml -- --check | Passed. |
| cargo check --manifest-path src-tauri/Cargo.toml --target aarch64-linux-android | Passed with the local Android SDK/NDK configured for the command. |
| pnpm build | Passed. |
| pnpm test | Passed: 23 browser tests plus the recommendation-filtering self-check. |
| git diff --check | Passed. |

The first Android invocation needed ANDROID_HOME set to the already-installed SDK. A subsequent compile identified one additional reminder-test caller of the changed state-machine method; it was updated, and the complete Android suite then passed.

No phone or emulator was attached according to adb devices. Real-device countdown/proceed/cancel, permission changes, and multitasking remain unverified. Publication is authorized through a GitHub PR, merge, and the existing signed-APK tag workflow for v2.3.0; no APK is installed on a device during verification.
