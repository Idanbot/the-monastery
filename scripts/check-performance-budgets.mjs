import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { URL } from 'node:url';

const dist = new URL('../dist/', import.meta.url);
const assets = new URL('./assets/', dist);
const sw = readFileSync(new URL('./sw.js', dist), 'utf8');
const files = readdirSync(assets).map((name) => ({
  name,
  bytes: statSync(new URL(`./${name}`, assets)).size,
  gzipBytes: gzipSync(readFileSync(new URL(`./${name}`, assets))).length
}));
const precachedJs = files.filter((file) => file.name.endsWith('.js') && sw.includes(`assets/${file.name}`));
const css = files.filter((file) => file.name.endsWith('.css'));
const charts = files.filter((file) => file.name.startsWith('charts-'));

const budgets = [
  {
    name: 'pre-cached JavaScript gzip',
    actual: precachedJs.reduce((total, file) => total + file.gzipBytes, 0),
    maximum: 300 * 1024
  },
  {
    name: 'application CSS gzip',
    actual: css.reduce((total, file) => total + file.gzipBytes, 0),
    maximum: 16 * 1024
  },
  {
    name: 'analytics chart chunk gzip',
    actual: Math.max(0, ...charts.map((file) => file.gzipBytes)),
    maximum: 110 * 1024
  }
];

let failed = false;
for (const budget of budgets) {
  const actualKb = (budget.actual / 1024).toFixed(1);
  const maximumKb = (budget.maximum / 1024).toFixed(1);
  const passed = budget.actual <= budget.maximum;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${budget.name}: ${actualKb} KiB / ${maximumKb} KiB`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;
