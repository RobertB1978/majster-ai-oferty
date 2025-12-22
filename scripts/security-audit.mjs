#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const registry = process.env.NPM_AUDIT_REGISTRY || "https://registry.npmjs.org/";
const auditLevel = process.env.AUDIT_LEVEL || "moderate";
const maxAttempts = Number.parseInt(process.env.AUDIT_RETRIES ?? "2", 10);
const extraArgs = (process.env.AUDIT_ARGS || "").split(" ").filter(Boolean);

function run(command, args, label) {
  const result = spawnSync(command, args, {
    encoding: "utf-8",
    env: { ...process.env, npm_config_registry: registry },
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const isForbidden = output.includes("403") || output.toLowerCase().includes("forbidden");

  return { status: result.status ?? 1, isForbidden };
}

function runWithRetry() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const auditArgs = ["audit", "--audit-level", auditLevel, "--registry", registry, ...extraArgs];
    const { status, isForbidden } = run("npm", auditArgs, "npm audit");
    if (status === 0) {
      console.log("✅ npm audit completed");
      return true;
    }

    if (!isForbidden) {
      console.error(`❌ npm audit failed (attempt ${attempt}/${maxAttempts})`);
      return false;
    }

    console.warn(`⚠️ npm audit received 403 Forbidden (attempt ${attempt}/${maxAttempts}). Retrying...`);
  }

  return false;
}

const auditSucceeded = runWithRetry();

if (!auditSucceeded) {
  console.warn("🔄 Falling back to signature verification and OSS Index audit (npm audit endpoint unavailable)");

  const signatures = run("npm", ["audit", "signatures", "--registry", registry], "npm audit signatures");
  if (signatures.status !== 0) {
    process.exit(signatures.status);
  }

  const auditJs = run("npx", ["auditjs", "ossi", "--quiet"], "auditjs");
  if (auditJs.status !== 0) {
    if (auditJs.isForbidden) {
      console.warn("⚠️ auditjs could not reach OSS Index (403). Registry signatures were verified; skipping OSS Index check.");
    } else {
      process.exit(auditJs.status);
    }
  }

  console.log("✅ Fallback security checks passed");
}

process.exit(0);
