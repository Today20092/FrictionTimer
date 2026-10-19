# Friction Timer

Android app that delays access to selected apps with an accessibility-service overlay. React/TypeScript renders the settings UI in Tauri 2; Rust owns configuration persistence and command bridges; Kotlin implements Android permissions, app discovery, foreground tracking, and overlays.

## Find the change boundary

1. Discover symbols with codebase-memory-mcp `search_graph`, trace callers/callees with `trace_path`, then read bodies with `get_code_snippet`. Use `query_graph` for structural questions and `get_architecture` for orientation. Index this repository if missing. Fall back to search/files for literals, non-code files, or insufficient graph coverage; check Android coverage explicitly.
2. Identify every affected contract and consumer before editing. Done means the UI, Rust, Kotlin, and tests relevant to the change are accounted for.
3. For library/framework/SDK/API/CLI/cloud usage questions, resolve the library with Context7 `resolve-library-id`, then `query-docs` for each distinct concept. Use the fetched documentation and cite it; repository configuration remains the source for local behavior.

## Where work belongs

| Change | Start here |
| --- | --- |
| Screens and navigation | `src/routes/`, `src/features/home/`, `src/router.tsx` |
| App editor | `src/components/AppForm.tsx`, `src/components/app-form/` |
| Frontend data access and refresh | `src/lib/friction/api.ts`, `hooks.ts`, `types.ts`, public exports in `index.ts` |
| Commands and persistence | `src-tauri/src/lib.rs`, `storage.rs` |
| Native bridges | `src-tauri/src/installed_apps.rs`, `permissions.rs`; matching Kotlin plugin directories |
| Android runtime | `src-tauri/gen/android/app/src/main/java/com/brunorochamoura/frictiontimer/` |
| Android unit tests | `src-tauri/gen/android/app/src/test/java/com/brunorochamoura/frictiontimer/` |

The tracked Android tree under `gen/android` contains maintained source, resources, manifest, and build configuration. Do not regenerate or discard it as disposable output. Build directories and generated Tauri glue are distinct from that source.

For route changes, read `src/routes/README.md` for naming conventions, with this caveat: this is a Vite + TanStack Router application, not TanStack Start. `src/routeTree.gen.ts` is marked generated, but `package.json` and `vite.config.ts` currently configure no route generator. Resolve generation when adding/removing routes; do not assume `pnpm build` regenerates the tree or hand-edit it as ordinary source. Preserve the root route's `Outlet`.

## Contracts to preserve

- Route persistence calls through `src/lib/friction/api.ts` and its hooks. Mutations emit the existing change event so subscribed screens refresh. Keep TypeScript payloads, Rust command names/Serde fields, and Kotlin plugin payloads aligned when changing a bridge.
- Rust writes `friction-timer.db`; `FrictionAppConfigRepository.kt` reads its `friction_apps` table directly. Database path, column, or message-encoding changes must account for both sides and existing user data. Retain Rust-side validation even when the form sanitizes input.
- Configuration durations are seconds; runtime cooldown timestamps are milliseconds. Preserve that boundary. Keep testable session decisions in `FrictionForegroundSessionStateMachine` and timer/message calculations in `FrictionOverlayLogic`, with Android effects in the service/controller.
- Permission changes reach the Rust bridge, Kotlin plugin, Android manifest/service configuration, and UI status handling. Review `src-tauri/capabilities/default.json` when changing Tauri access. Browser-only checks cannot validate these permissions or native overlays.
- Keep signing credentials, keystores, and machine-local SDK configuration out of commits. Android signing reads local `keystore.properties`; a release build can succeed unsigned when no usable keystore is configured.

## Setup and verification

For Android prerequisites and device/release builds, read [README.md](README.md#build-it-yourself). Use pnpm with `pnpm-lock.yaml`; `pnpm install` installs frontend dependencies. `pnpm dev` serves the frontend; `pnpm tauri android dev` runs the native application.

Run checks for the changed layers, from the repository root unless stated otherwise:

| Scope | Check |
| --- | --- |
| Frontend types and production bundle | `pnpm build` |
| Rust suite | `cargo test --manifest-path src-tauri/Cargo.toml` |
| Focused persistence test | `cargo test --manifest-path src-tauri/Cargo.toml storage::tests::create_list_and_get_round_trip` |
| Rust formatting | `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` |
| Android JVM tests, from `src-tauri/gen/android` | `./gradlew :app:testDebugUnitTest` (PowerShell: `./gradlew.bat :app:testDebugUnitTest`) |
| Focused Android suite, same directory | Append `--tests "com.brunorochamoura.frictiontimer.FrictionForegroundSessionStateMachineTest"` |

Android Gradle checks require the local Java/Android/Tauri build environment. `FrictionOverlayLogicTest` covers the other pure Kotlin logic suite. Rust unit tests live inside `storage.rs` and `installed_apps.rs`.

For service/overlay changes, also exercise a configured app on a device or emulator: countdown and proceed, cancel, leaving/re-entering the app, cooldown expiry, and permission changes. A passing JVM or desktop Rust suite does not establish device behavior.

Run `pnpm test` for Playwright UI checks with a simulated native bridge. The Android release workflow also runs frontend, Rust, and Android JVM checks before publishing signed APKs. There is no lint script or pre-commit configuration. Follow neighboring source formatting and the Android `.editorconfig` rather than reformatting unrelated files.

Completion: review the diff for unintended generated files and user-data/signing artifacts; report checks run, failures, and device/environment checks that remain unverified. No repository-specific commit or PR template is currently configured.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Use a single-context layout with a root `GLOSSARY.md` and `docs/adr/`. See `docs/agents/domain.md`.
