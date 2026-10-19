# APK releases

The [Android release workflow](../.github/workflows/android-release.yml) builds an ARM64 APK on tag pushes matching `v*`. A manual run builds and uploads an artifact without publishing a release.

Before publishing, it checks frontend behavior, Rust formatting/tests, Android JVM tests, version alignment, the optimized theme bridge fields, and the APK signature. A successful tag build uploads the APK and its SHA-256 checksum with the matching version's release notes.

## Signing setup

Repository Actions secrets:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded private release keystore.
- `ANDROID_KEYSTORE_PASSWORD`: keystore password.
- `ANDROID_KEY_ALIAS`: signing alias.
- `ANDROID_KEY_PASSWORD`: key password.

The workflow restores the key into the runner's temporary directory, writes ignored signing properties, and removes both after the build. Keep a private backup: losing the key/passwords prevents updates to existing release installs. Never commit them.

For local signing, create ignored `src-tauri/gen/android/keystore.properties`:

```properties
storeFile=/absolute/path/to/private-release.jks
storePassword=YOUR_PRIVATE_PASSWORD
keyAlias=YOUR_ALIAS
keyPassword=YOUR_PRIVATE_PASSWORD
```

On Windows, use forward slashes in the path. See [Tauri's Android signing documentation](https://v2.tauri.app/distribute/sign/android/).

## Publish a version

Every app update intended for distribution gets a new semantic version and a published GitHub Release. Use a patch version for fixes, a minor version for new features, and a major version for incompatible changes. Do not distribute source updates through a manual Actions run alone.

1. Update versions in `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and `src-tauri/Cargo.lock`. The header reads the package version.
2. Write `docs/releases/vX.Y.Z.md`.
3. Commit and push to main. Optionally run the workflow manually first.
4. Tag the commit and push the tag:

```sh
git tag vX.Y.Z
git push origin vX.Y.Z
```

Only tag runs publish. Each release uploads `FrictionTimer-arm64.apk`, which keeps the README's latest-download URL stable, plus its checksum. Failed checks leave no published release. Rerunning a tag replaces matching assets. Use a new version/tag for source changes.

## Compatibility

This fork's key differs from upstream and local debug keys. Android cannot update a package across different signatures. Do not uninstall a user's build for release verification: uninstalling removes its local settings. Verify signing without replacing an incompatible installation.
