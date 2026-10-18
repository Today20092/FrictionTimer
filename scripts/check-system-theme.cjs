const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync('src/lib/system-theme.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup(native, getTheme) {
  const colors = new Map();
  const classes = new Map();
  const events = {};
  const style = { setProperty: (key, value) => colors.set(key, value) };
  const document = {
    hidden: false,
    documentElement: { style, classList: { toggle: (key, value) => classes.set(key, value) } },
    addEventListener: (name, fn) => events[name] = fn,
  };
  const context = {
    exports: {}, document, console: { warn() {} },
    window: {
      addEventListener: (name, fn) => events[name] = fn,
      matchMedia: () => ({ addEventListener: (name, fn) => events[name] = fn }),
    },
    require: name => name === '@tauri-apps/api/core'
      ? { isTauri: () => native } : { getSystemTheme: getTheme },
  };
  vm.runInNewContext(source, context);
  context.exports.initializeSystemTheme();
  return { colors, classes, events, style, document };
}

async function main() {
  const flush = () => new Promise(resolve => setImmediate(resolve));
  let calls = 0;
  setup(false, async () => { calls++; });
  await flush();
  assert.equal(calls, 0, 'browser must not invoke native commands');
  const fallback = setup(true, async () => null);
  await flush();
  assert.equal(fallback.colors.size, 0, 'unsupported devices keep fallback colors');
  let theme = { dark: false, colors: { primary: '#ABCDEF', background: '#ffffff', bad: 'url(secret)' } };
  const app = setup(true, async () => theme);
  await flush();
  assert.equal(app.colors.get('--primary'), '#ABCDEF');
  assert.equal(app.colors.has('--bad'), false);
  assert.equal(app.style.colorScheme, 'light');
  assert.equal(app.classes.get('dark'), false);
  theme = { dark: true, colors: { primary: '#123456' } };
  app.events.change();
  await flush();
  assert.equal(app.colors.get('--primary'), '#123456');
  assert.equal(app.classes.get('dark'), true);
  assert.equal(app.style.colorScheme, 'dark');
  const pending = [];
  const racing = setup(true, () => new Promise(resolve => pending.push(resolve)));
  racing.events.focus();
  pending[1]({ dark: true, colors: { primary: '#222222' } });
  pending[0]({ dark: false, colors: { primary: '#111111' } });
  await flush();
  assert.equal(racing.colors.get('--primary'), '#222222', 'stale results cannot replace the latest theme');
  const failed = setup(true, async () => { throw new Error('bridge unavailable'); });
  await flush();
  assert.equal(failed.colors.size, 0, 'bridge failure preserves fallback');
  console.log('System theme checks passed: browser/device fallback, light/dark, refresh, validation, stale replies, bridge failure.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
