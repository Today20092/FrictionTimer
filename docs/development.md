# Development

React, TypeScript, Vite, and Tauri 2 render settings. Rust persists configuration and exposes commands. Maintained Kotlin under `src-tauri/gen/android` handles app discovery, permissions, sessions, overlays, and notifications. Do not discard that Android tree as generated output.

## Prerequisites

Use Node.js 24, pnpm 11.21.0, Rust stable, JDK 21, and Android SDK. The release workflow pins platform/build tools 36 and NDK 28.2.13676358. Set `JAVA_HOME`, `ANDROID_HOME`, and `NDK_HOME` for your machine.

```sh
rustup target add aarch64-linux-android
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

On Linux, install the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) too. Use `pnpm dev` for browser UI development or `pnpm tauri android dev` for a connected device/emulator. A plain browser does not provide native commands; tests simulate that bridge.

## Checks

```sh
pnpm build
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
```

Browser tests start Vite on port 1425 and cover recovery, validation, recommendations, reminders, selection scrolling, and compact layouts.

After an Android build generates the Tauri glue, run JVM tests from `src-tauri/gen/android`:

```sh
./gradlew :app:testArmDebugUnitTest
```

On Windows use `./gradlew.bat`. Device checks remain necessary for permission settings, overlays, notification delivery, screen-off behavior, and accessibility.

## Android builds

```sh
pnpm tauri android build --debug --target aarch64 --apk
pnpm tauri android build --target aarch64 --apk
```

APKs are under `src-tauri/gen/android/app/build/outputs/apk/`. Release signing requires the private configuration in the [release guide](releases.md). Without it, a local release build can be unsigned; do not distribute that as a signed release.

## Contributions

Issues/specs live as Markdown under `.scratch/<feature>/`; see [issue tracker conventions](agents/issue-tracker.md). Follow [AGENTS.md](../AGENTS.md) for layer boundaries and checks. Keep credentials, keystores, device data, and local SDK configuration out of commits.
