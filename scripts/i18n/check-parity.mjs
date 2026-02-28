#!/usr/bin/env node
/**
 * scripts/i18n/check-parity.mjs
 *
 * CI gate: verifies that PL, EN and UK locale files share an identical set
 * of translation keys (flat dot-path keys, recursively collected).
 *
 * Polish (pl.json) is the canonical source of truth.
 *   • Missing keys in EN or UK  → fatal error
 *   • Extra (orphaned) keys     → fatal error
 *   • Empty string values ("")  → warning by default
 *                                  pass --fail-on-empty to treat as error
 *
 * Usage:
 *   node scripts/i18n/check-parity.mjs
 *   node scripts/i18n/check-parity.mjs --fail-on-empty
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — key parity violation (always fatal)
 *   2 — empty value found + --fail-on-empty flag was set
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Recursively collect all leaf dot-path keys from a JSON object. */
function flattenKeys(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isObject(v)) {
      out.push(...flattenKeys(v, key));
    } else {
      out.push(key);
    }
  }
  return out;
}

/** Returns sorted keys that are in set `a` but absent from set `b`. */
function missingFrom(a, b) {
  return [...a].filter(k => !b.has(k)).sort();
}

/** Collect leaf keys whose stored value is an empty string. */
function emptyValueKeys(obj) {
  return flattenKeys(obj).filter(key => {
    const segments = key.split('.');
    let node = obj;
    for (const seg of segments) {
      if (!isObject(node)) return false;
      node = node[seg];
    }
    return node === '';
  });
}

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(__dirname, '../..');
const LOCALES    = path.join(REPO_ROOT, 'src', 'i18n', 'locales');

const failOnEmpty = process.argv.includes('--fail-on-empty');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  i18n Key Parity Check');
console.log(`  Locales:       ${LOCALES}`);
console.log(`  fail-on-empty: ${failOnEmpty}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ──────────────────────────────────────────────
// Load locales
// ──────────────────────────────────────────────

const pl = loadJson(path.join(LOCALES, 'pl.json'));
const en = loadJson(path.join(LOCALES, 'en.json'));
const uk = loadJson(path.join(LOCALES, 'uk.json'));

const plKeys = new Set(flattenKeys(pl));
const enKeys = new Set(flattenKeys(en));
const ukKeys = new Set(flattenKeys(uk));

console.log(`PL keys: ${plKeys.size}`);
console.log(`EN keys: ${enKeys.size}`);
console.log(`UK keys: ${ukKeys.size}\n`);

let exitCode = 0;

// ──────────────────────────────────────────────
// 1. Key parity (fatal if any violation)
// ──────────────────────────────────────────────

const missingEn = missingFrom(plKeys, enKeys);
const missingUk = missingFrom(plKeys, ukKeys);
const extraEn   = missingFrom(enKeys, plKeys);
const extraUk   = missingFrom(ukKeys, plKeys);

function reportViolation(label, keys) {
  if (keys.length === 0) return;
  console.error(`❌ ${label} (${keys.length}):`);
  keys.slice(0, 30).forEach(k => console.error(`   ${k}`));
  if (keys.length > 30) console.error(`   … and ${keys.length - 30} more`);
  console.error();
  exitCode = 1;
}

reportViolation('Missing in EN', missingEn);
reportViolation('Missing in UK', missingUk);
reportViolation('Extra (orphaned) in EN', extraEn);
reportViolation('Extra (orphaned) in UK', extraUk);

if (exitCode === 0) {
  console.log('✅ Key parity: PL / EN / UK — identical key sets\n');
}

// ──────────────────────────────────────────────
// 2. Empty value scan
// ──────────────────────────────────────────────

const emptyPl = emptyValueKeys(pl);
const emptyEn = emptyValueKeys(en);
const emptyUk = emptyValueKeys(uk);

function reportEmpty(lang, keys) {
  if (keys.length === 0) return;
  if (failOnEmpty) {
    console.error(`❌ [ERROR] Empty values in ${lang} (${keys.length}):`);
  } else {
    console.warn(`⚠️  [WARN]  Empty values in ${lang} (${keys.length}):`);
  }
  keys.slice(0, 20).forEach(k => console.log(`   ${k}`));
  if (keys.length > 20) console.log(`   … and ${keys.length - 20} more`);
  console.log();
}

reportEmpty('PL', emptyPl);
reportEmpty('EN', emptyEn);
reportEmpty('UK', emptyUk);

if (failOnEmpty && (emptyPl.length || emptyEn.length || emptyUk.length)) {
  exitCode = Math.max(exitCode, 2);
}

// ──────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────

if (exitCode === 0) {
  console.log('✅ All i18n parity checks passed.');
} else {
  console.error('❌ i18n parity check FAILED — fix the issues above before merging.');
}

process.exit(exitCode);
