import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const version = JSON.parse(read("package.json")).version;
assert.match(version, /^\d+\.\d+\.\d+$/);
assert.equal(JSON.parse(read("src-tauri/tauri.conf.json")).version, version);
assert.equal(read("src-tauri/Cargo.toml").match(/^version = "([^"]+)"/m)?.[1], version);
assert.equal(read("src-tauri/Cargo.lock").match(/name = "friction_timer"\r?\nversion = "([^"]+)"/)?.[1], version);
assert.ok(existsSync(new URL("../docs/releases/v" + version + ".md", import.meta.url)), "Release notes are required");
if (process.env.RELEASE_REF?.startsWith("refs/tags/")) {
  assert.equal(process.env.RELEASE_REF, "refs/tags/v" + version, "Tag must match app version");
}
console.log("Release version and notes verified:", version);
