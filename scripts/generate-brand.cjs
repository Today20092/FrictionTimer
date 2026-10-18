// Run with Node and sharp available (NODE_PATH may point to the desktop bundled packages).
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const brand = path.join(root, 'public/brand');
const source = fs.readFileSync(path.join(brand, 'hourglass.svg'), 'utf8');
const body = source.slice(source.indexOf('>') + 1, source.lastIndexOf('</svg>'));
const wrap = (content, width = 128, height = width) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">${content}</svg>`;
const mono = color => body.replace(/#[0-9a-f]{6}/gi, color);
const save = (name, svg) => fs.writeFileSync(path.join(brand, name), svg.trimEnd() + '\n');
const png = (svg, name, size) => sharp(Buffer.from(svg)).resize(size).png().toFile(path.join(brand, name));

async function main() {
  const app = wrap(`<rect width="128" height="128" rx="28" fill="#282828"/>${body}`);
  save('app-icon.svg', app);
  save('hourglass-monochrome.svg', wrap(mono('#282828')));
  save('hourglass-reversed.svg', wrap(mono('#ebdbb2')));
  const gray = source.replaceAll('#fabd2f', '#bdbdbd').replaceAll('#ebdbb2', '#eeeeee').replaceAll('#504945', '#616161');
  save('hourglass-grayscale.svg', gray);
  // The 90px mark sits inside Android's central 66/108 safe region.
  save('android-foreground.svg', wrap(`<g transform="translate(19 19) scale(.703125)">${body}</g>`));
  save('android-monochrome.svg', wrap(`<g transform="translate(19 19) scale(.703125)">${mono('#ffffff')}</g>`));
  for (const [name, content] of [['hourglass', source], ['app-icon', app], ['hourglass-grayscale', gray], ['hourglass-monochrome', wrap(mono('#282828'))], ['hourglass-reversed', wrap(mono('#ebdbb2'))]]) {
    for (const size of [16, 24, 32, 48, 64, 128, 256, 512, 1024]) await png(content, `${name}-${size}.png`, size);
  }
  for (const [name, color, mark] of [['wordmark', '#282828', body], ['wordmark-reversed', '#ebdbb2', body], ['wordmark-monochrome', '#282828', mono('#282828')]]) {
    const svg = wrap(`<g transform="translate(0 0)">${mark}</g><text x="148" y="78" fill="${color}" font-family="'JetBrains Mono',monospace" font-size="40" font-weight="700" letter-spacing="-1.5">Friction Timer</text>`, 500, 128);
    save(`${name}.svg`, svg);
    await png(svg, `${name}.png`, 1500);
  }
  await sharp(Buffer.from(app)).resize(32).png().toFile(path.join(root, 'public/favicon.png'));
  for (const size of [16, 32, 128, 1024]) {
    const info = await sharp(path.join(brand, `app-icon-${size}.png`)).metadata();
    assert.equal(info.width, size);
    assert.equal(info.height, size);
    assert.equal(info.channels, 4);
  }
  console.log('Generated brand SVGs, PNG sizes, wordmarks, and favicon; dimension/alpha checks passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
