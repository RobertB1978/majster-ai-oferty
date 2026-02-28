#!/usr/bin/env node
// check-no-hardcoded-polish.mjs
// Regression guard: fails if hardcoded Polish UI strings appear in
// TSX/TS component/page/hook files outside the allowed list.
//
// Usage:
//   node scripts/check-no-hardcoded-polish.mjs            -- report only
//   node scripts/check-no-hardcoded-polish.mjs --fail     -- fail on violations
//
// Excluded paths (always safe):
//   src/i18n/locales         -- canonical locale files
//   src/data/tradeCatalog.ts -- static catalog data (Polish = canonical; translated at render)
//   src/data/starterPacks.ts -- item data (Materiał/Robocizna are DB enum values, not UI)
//   src/test                 -- test files
//   *.test.ts / *.spec.ts    -- test fixtures

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const FAIL_MODE = process.argv.includes('--fail');

const SCAN_DIRS = ['src/pages', 'src/components', 'src/hooks'];

const EXCLUDED_PATHS = new Set([
  'src/i18n/locales',
  'src/data/tradeCatalog.ts',
  'src/data/starterPacks.ts',
  'src/test',
]);

const EXCLUDED_PATTERNS = [
  /\.test\.[tj]sx?$/,
  /\.spec\.[tj]sx?$/,
];

// Polish diacritics via unicode escapes to avoid encoding issues
const POLISH_DIACRITIC_RE = /[\u0105\u0107\u0119\u0142\u0144\u00f3\u015b\u017a\u017c\u0104\u0106\u0118\u0141\u0143\u00d3\u015a\u0179\u017b]/;

// DB enum values that are legitimately used as filter keys / type annotations,
// not rendered directly as UI text. Lines matching these are exempt.
const SAFE_LINE_PATTERNS = [
  /['"`]Materia\u0142['"`]/,
  /['"`]Robocizna['"`]/,
  /['"`]Nowy['"`]/,
  /['"`]Wycena w toku['"`]/,
  /['"`]Oferta wys\u0142ana['"`]/,
  /['"`]Zaakceptowany['"`]/,
];

function isExcluded(filePath) {
  const rel = relative(ROOT, filePath);
  for (const exc of EXCLUDED_PATHS) {
    if (rel.startsWith(exc)) return true;
  }
  for (const pat of EXCLUDED_PATTERNS) {
    if (pat.test(filePath)) return true;
  }
  return false;
}

function isSafeLine(line) {
  return SAFE_LINE_PATTERNS.some(re => re.test(line));
}

function* walkFiles(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch (_) { return; }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch (_) { continue; }
    if (stat.isDirectory()) {
      yield* walkFiles(full);
    } else if (/\.[tj]sx?$/.test(entry)) {
      yield full;
    }
  }
}

let violations = 0;
const violationLines = [];

for (const dir of SCAN_DIRS) {
  for (const file of walkFiles(join(ROOT, dir))) {
    if (isExcluded(file)) continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!POLISH_DIACRITIC_RE.test(line)) continue;
      if (isSafeLine(line)) continue;
      violations++;
      violationLines.push('  ' + relative(ROOT, file) + ':' + (i + 1) + ': ' + line.trim().slice(0, 120));
    }
  }
}

console.log('=== Hardcoded Polish UI Guard ===');
console.log('Scanned: ' + SCAN_DIRS.join(', '));
console.log('Violations: ' + violations);
console.log('');

if (violations > 0) {
  console.log('Violations (first 30):');
  violationLines.slice(0, 30).forEach(l => console.log(l));
  if (violationLines.length > 30) {
    console.log('  ... and ' + (violationLines.length - 30) + ' more');
  }
  console.log('');
}

if (FAIL_MODE && violations > 0) {
  console.error('FAIL: ' + violations + ' hardcoded Polish UI string(s) found.');
  process.exit(1);
} else {
  console.log(violations === 0
    ? 'PASS: No hardcoded Polish UI strings found.'
    : 'REPORT: ' + violations + ' occurrence(s). Use --fail to gate CI.');
  process.exit(0);
}
