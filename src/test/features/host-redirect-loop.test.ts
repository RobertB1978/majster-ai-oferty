/**
 * Tests verifying that the app does NOT perform app-level host redirects.
 *
 * Host canonicalization (www → apex, vercel.app → apex) is handled exclusively
 * by Vercel Domains configuration. The app code must never do hard redirects
 * based on hostname — only informational banners are allowed.
 *
 * These tests catch regressions that could re-introduce redirect loops.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

// ── Helpers ──

/** Recursively collect all .ts/.tsx files under a directory (simple glob). */
function collectSourceFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'test') {
      collectSourceFiles(full, files);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.')) {
      files.push(full);
    }
  }
  return files;
}

// Patterns that indicate a hard host redirect (not just reading hostname for display)
const HARD_REDIRECT_PATTERNS = [
  // window.location.replace('https://majsterai.com/...')
  /window\.location\.replace\s*\(\s*['"`]https?:\/\/(www\.)?majsterai\.com/,
  // window.location.href = 'https://majsterai.com/...'
  /window\.location\.href\s*=\s*['"`]https?:\/\/(www\.)?majsterai\.com/,
  // location.assign('https://majsterai.com/...')
  /location\.assign\s*\(\s*['"`]https?:\/\/(www\.)?majsterai\.com/,
  // window.location.replace('https://...vercel.app/...')
  /window\.location\.replace\s*\(\s*['"`]https?:\/\/.*vercel\.app/,
  // window.location.href = 'https://...vercel.app/...'
  /window\.location\.href\s*=\s*['"`]https?:\/\/.*vercel\.app/,
];

describe('No app-level host redirect loop', () => {
  const srcDir = resolve(__dirname, '../../');
  const sourceFiles = collectSourceFiles(srcDir);

  it('has source files to check (sanity)', () => {
    expect(sourceFiles.length).toBeGreaterThan(10);
  });

  it('no source file does a hard redirect to majsterai.com or vercel.app', () => {
    const violations: string[] = [];

    for (const filePath of sourceFiles) {
      const content = readFileSync(filePath, 'utf-8');
      for (const pattern of HARD_REDIRECT_PATTERNS) {
        if (pattern.test(content)) {
          const relativePath = filePath.replace(srcDir, 'src');
          violations.push(`${relativePath} matches ${pattern.source}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('vercel.json does not contain a www→apex host redirect (managed by Vercel Domains)', () => {
    const vercelJson = JSON.parse(
      readFileSync(resolve(__dirname, '../../../vercel.json'), 'utf-8')
    );
    const redirects: Array<{ has?: Array<{ type: string; value: string }> }> =
      vercelJson.redirects ?? [];

    const hostRedirects = redirects.filter((r) =>
      r.has?.some((h) => h.type === 'host' && /majsterai\.com/.test(h.value))
    );

    expect(hostRedirects).toEqual([]);
  });
});

describe('HostMismatchBanner is informational only', () => {
  it('App.tsx HostMismatchBanner does not call window.location.replace or assign', () => {
    const appSource = readFileSync(
      resolve(__dirname, '../../App.tsx'),
      'utf-8'
    );

    // Extract the HostMismatchBanner function body (approximate: from declaration to next function)
    const bannerMatch = appSource.match(
      /function HostMismatchBanner\(\)[\s\S]*?^}/m
    );
    expect(bannerMatch).not.toBeNull();

    const bannerCode = bannerMatch![0];
    expect(bannerCode).not.toMatch(/window\.location\.replace/);
    expect(bannerCode).not.toMatch(/window\.location\.href\s*=/);
    expect(bannerCode).not.toMatch(/location\.assign/);
  });
});

describe('Login page renders on canonical host', () => {
  it('App.tsx has a /login route that does not depend on hostname', () => {
    const appSource = readFileSync(
      resolve(__dirname, '../../App.tsx'),
      'utf-8'
    );

    // /login route exists
    expect(appSource).toMatch(/path="\/login"/);

    // The route is not wrapped in any host-conditional rendering
    // (i.e., there's no `if (host !== CANONICAL_HOST)` before the Routes)
    // We verify by checking that HostMismatchBanner is rendered BEFORE Routes,
    // not wrapping them.
    const bannerIndex = appSource.indexOf('HostMismatchBanner');
    const routesIndex = appSource.indexOf('<Routes>');
    expect(bannerIndex).toBeLessThan(routesIndex);
  });
});

describe('splash-guard.js does not hard-redirect', () => {
  it('splash-guard.js contains no location.replace or location.href assignment', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../public/splash-guard.js'),
      'utf-8'
    );

    expect(source).not.toMatch(/location\.replace\s*\(/);
    expect(source).not.toMatch(/location\.href\s*=/);
    // location.reload() is OK — it's a retry, not a cross-host redirect
  });
});
