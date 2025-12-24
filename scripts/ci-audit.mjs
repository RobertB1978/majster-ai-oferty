#!/usr/bin/env node

/**
 * Hardened npm audit runner with:
 * - Explicit registry override (default: https://registry.npmjs.org/)
 * - Stable npm/node version logging for forensics
 * - Retries for transient 403/5xx responses
 * - Clear failure output (network vs vulnerabilities)
 */

import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const levelFlag = args.find((arg) => arg.startsWith('--level=')) || '';
const productionOnly = args.includes('--production');
const level = levelFlag.split('=')[1] || process.env.AUDIT_LEVEL || 'moderate';
const registry = process.env.AUDIT_REGISTRY || 'https://registry.npmjs.org/';
const maxRetries = Number(process.env.AUDIT_RETRIES || 3);

const npmArgs = [
  'audit',
  '--audit-level',
  level,
  '--registry',
  registry,
  '--json',
];

if (productionOnly) {
  npmArgs.push('--omit=dev');
}

const runAudit = (attempt) => {
  const result = spawnSync('npm', npmArgs, { encoding: 'utf8' });

  if (result.error) {
    console.error(`Audit attempt ${attempt} failed to execute:`, result.error);
    return { ok: false, code: 1, cause: 'spawn' };
  }

  const output = result.stdout || result.stderr || '';
  const is403 = /403 Forbidden|E403|Method forbidden/i.test(output);
  const isNetwork = /ENOTFOUND|ECONN|ENETUNREACH|ETIMEDOUT/i.test(output);

  if (result.status === 0) {
    console.log(`npm audit attempt ${attempt} succeeded.`);
    return { ok: true, code: 0 };
  }

  if (is403 || isNetwork) {
    console.warn(`npm audit attempt ${attempt} hit a network/registry error (code ${result.status}).`);
    return { ok: false, code: result.status, cause: is403 ? '403' : 'network' };
  }

  // Vulnerabilities or other hard failures
  console.error(output);
  return { ok: false, code: result.status, cause: 'vulnerabilities' };
};

console.log(`Running npm audit (level: ${level}, registry: ${registry}, productionOnly: ${productionOnly})`);
console.log(`Node: ${process.version} | npm: ${spawnSync('npm', ['-v'], { encoding: 'utf8' }).stdout?.trim()}`);
console.log(`npm registry config: ${spawnSync('npm', ['config', 'get', 'registry'], { encoding: 'utf8' }).stdout?.trim()}`);

let attempt = 1;
let lastFailure = null;

while (attempt <= maxRetries) {
  const result = runAudit(attempt);
  if (result.ok) {
    process.exit(0);
  }

  lastFailure = result;
  if (result.cause === 'vulnerabilities') {
    console.error('npm audit reported vulnerabilities. Failing fast.');
    process.exit(result.code);
  }

  attempt += 1;
  if (attempt <= maxRetries) {
    console.warn(`Retrying npm audit (attempt ${attempt} of ${maxRetries}) after registry/network issue...`);
  }
}

console.error('npm audit failed after retries.');
if (lastFailure?.cause === '403') {
  console.error(`Received 403 from audit endpoint. Confirm access to ${registry} and that the audit endpoint is not blocked by a proxy/WAF.`);
}
process.exit(lastFailure?.code ?? 1);
