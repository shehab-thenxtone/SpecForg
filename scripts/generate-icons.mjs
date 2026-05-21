import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, '../assets/master-icon.svg');
const assetsDir = resolve(__dirname, '../assets');

const SIZES = [16, 32, 48, 64, 128, 512];

const svgContent = readFileSync(svgPath, 'utf-8');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: transparent; }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;

const browser = await chromium.launch();

for (const size of SIZES) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
  });

  await page.setContent(html);

  await page.evaluate((s) => {
    const svg = document.querySelector('svg');
    svg.setAttribute('width', s);
    svg.setAttribute('height', s);
    svg.style.width = `${s}px`;
    svg.style.height = `${s}px`;
  }, size);

  const outFile = size === 512
    ? `${assetsDir}/icon.png`
    : `${assetsDir}/icon${size}.png`;

  await page.screenshot({
    path: outFile,
    clip: { x: 0, y: 0, width: size, height: size },
    omitBackground: true,
  });

  await page.close();
  console.log(`✓ ${size}x${size} → ${outFile}`);
}

await browser.close();
console.log('\nAll icons generated.');
