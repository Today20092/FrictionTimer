import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Check R8's output: source-level tests cannot catch renamed JSON fields.
const mapping = readFileSync(process.argv[2], "utf8");
const response = "com.brunorochamoura.frictiontimer.SystemThemeResponse";
const block = mapping.split(/\r?\n(?=[^\s#])/).find(line => line.startsWith(`${response} -> `));
assert.ok(block, "Theme response is missing from the release mapping");
assert.ok(block.startsWith(`${response} -> ${response}:`), "Theme response class was renamed");
for (const [type, field] of [["boolean", "dark"], ["java.util.Map", "colors"]]) {
  assert.ok(
    block.split(/\r?\n/).some(line => line.trim() === `${type} ${field} -> ${field}`),
    `Theme response field ${field} was removed or renamed; Rust cannot read the palette`,
  );
}
console.log("Release theme bridge fields preserved: dark, colors");
