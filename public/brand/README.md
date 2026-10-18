# Friction Timer identity

Original vector artwork inspired by the hourglass emoji, drawn for this project. No Apple or Twemoji artwork is included. The application palette and existing JetBrains Mono typography are retained.

- `hourglass.svg`: editable color master, transparent background.
- `app-icon.svg`: charcoal application tile.
- `hourglass-grayscale.svg`, `hourglass-monochrome.svg`, `hourglass-reversed.svg`: grayscale, dark single ink, and light single ink.
- Matching PNGs: 16, 24, 32, 48, 64, 128, 256, 512, 1024 pixels.
- `wordmark*.svg`: editable JetBrains Mono Bold lockups. Install that font for exact SVG text rendering; PNG exports are fixed appearance.
- `android-*.svg`: separate launcher layers, with the foreground inside the adaptive safe region.
- `index.html`: responsive visual reference and small-size specimens.

Use a minimum clear space equal to a cap's height. Do not stretch or rotate the mark. Use the dark monochrome version on light surfaces and the reversed version on dark surfaces. Keep the existing font; no new typeface or font binaries are distributed.

Regenerate from the repository root with Node and `sharp` available:

```powershell
# In Codex desktop, NODE_PATH can point to the bundled node_modules; otherwise use a local sharp installation.
node scripts/generate-brand.cjs
pnpm tauri icon public/brand/tauri-icons.json
```

The [Tauri icon generator](https://v2.tauri.app/develop/icons/) produces ICO, ICNS, desktop/iOS PNGs, and Android launcher densities. Its local `--help` describes the JSON manifest fields used here. After regeneration, ensure `mipmap-anydpi-v26/ic_launcher_round.xml` matches `ic_launcher.xml` so round-icon launchers also use adaptive layers.
