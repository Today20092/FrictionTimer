import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

// Inspect compiled fields: source tests and R8 mappings cannot prove they survived.
assert.ok(process.env.ANDROID_HOME, "ANDROID_HOME must point to the Android SDK");
assert.ok(process.argv[2], "Pass the APK's extracted classes.dex");
const dexdump = join(process.env.ANDROID_HOME, "build-tools", "36.0.0", process.platform === "win32" ? "dexdump.exe" : "dexdump");
const dump = execFileSync(dexdump, [process.argv[2]], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const response = "'Lcom/brunorochamoura/frictiontimer/SystemThemeResponse;'";
const block = dump.split(/Class descriptor\s*:/).find(section => section.trimStart().startsWith(response));
assert.ok(block, "Theme response is missing from the release bytecode");
const fields = block.split("Direct methods")[0];
for (const [type, field] of [["Z", "dark"], ["Ljava/util/Map;", "colors"]]) {
  assert.ok(
    new RegExp(`name\\s*:\\s*'${field}'\\s+type\\s*:\\s*'${type}'`).test(fields),
    `Theme response field ${field} was removed or renamed; Rust cannot read the palette`,
  );
}
console.log("Release theme bridge fields preserved: dark, colors");
