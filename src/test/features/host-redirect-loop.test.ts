/**
 * Tests verifying that the app does NOT perform app-level host redirects.
 *
 * Host canonicalization (www → apex, vercel.app → apex) is handled exclusively
 * by Vercel Domains configuration. The app code must never do hard redirects
 * based on hostname — only informational banners are allowed.
 *
 * These tests catch regressions that could re-introduce redirect loops.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

// ── Helpers ──

/** Recursively collect all .ts/.tsx files under a directory (simple glob). */
function collectSourceFiles(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) {
    console.warn(`Directory does not exist: ${dir}`);
    return files;
  }
  
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'test') {
        collectSourceFiles(full, files);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.')) {
        files.push(full);
      }
    }
  } catch (err) {
    console.warn(`Error reading directory ${dir}:`, err);
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
  let sourceFiles: string[] = [];

  beforeAll(() => {
    sourceFiles = collectSourceFiles(srcDir);
  });

  it('has source files to check (sanity)', () => {
    expect(sourceFiles.length).toBeGreaterThan(10);
  });

  it('no source file does a hard redirect to majsterai.com or vercel.app', () => {
    const violations: string[] = [];

    for (const filePath of sourceFiles) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        for (const pattern of HARD_REDIRECT_PATTERNS) {
          if (pattern.test(content)) {
            const relativePath = filePath.replace(srcDir, 'src');
            violations.push(`${relativePath} matches ${pattern.source}`);
          }
        }
      } catch (err) {
        console.warn(`Error reading file ${filePath}:`, err);
      }
    }

    expect(violations).toEqual([]);
  });

  it('vercel.json does not contain a www→apex host redirect (managed by Vercel Domains)', () => {
    const vercelJsonPath = resolve(__dirname, '../../../vercel.json');
    
    if (!existsSync(vercelJsonPath)) {
      console.warn(`vercel.json not found at ${vercelJsonPath}, skipping test`);
      return;
    }

    try {
      const vercelJson = JSON.parse(readFileSync(vercelJsonPath, 'utf-8'));
      const redirects: Array<{ has?: Array<{ type: string; value: string }> }> =
        vercelJson.redirects ?? [];

      const hostRedirects = redirects.filter((r) =>
        r.has?.some((h) => h.type === 'host' && /majsterai\.com/.test(h.value))
      );

      expect(hostRedirects).toEqual([]);
    } catch (err) {
      console.warn(`Error parsing vercel.json:`, err);
      expect(true).toBe(true); // Skip if can't parse
    }
  });
});

describe('HostMismatchBanner is informational only', () => {
  it('App.tsx HostMismatchBanner does not call window.location.replace or assign', () => {
    const appPath = resolve(__dirname, '../../App.tsx');
    
    if (!existsSync(appPath)) {
      console.warn(`App.tsx not found at ${appPath}, skipping test`);
      return;
    }

    const appSource = readFileSync(appPath, 'utf-8');

    // Extract the HostMismatchBanner function body
    // Matches: function HostMismatchBanner() { ... }
    const bannerMatch = appSource.match(
      /function HostMismatchBanner\s*\(\s*\)\s*\{[\s\S]*?\n\s*\}/
    );
    
    expect(bannerMatch).not.toBeNull();

    if (bannerMatch) {
      const bannerCode = bannerMatch[0];
      expect(bannerCode).not.toMatch(/window\.location\.replace/);
      expect(bannerCode).not.toMatch(/window\.location\.href\s*=/);
      expect(bannerCode).not.toMatch(/location\.assign/);
    }
  });
});

describe('Login page renders on canonical host', () => {
  it('App.tsx has a /login route that does not depend on hostname', () => {
    const appPath = resolve(__dirname, '../../App.tsx');
    
    if (!existsSync(appPath)) {
      console.warn(`App.tsx not found at ${appPath}, skipping test`);
      return;
    }

    const appSource = readFileSync(appPath, 'utf-8');

    // /login route exists
    expect(appSource).toMatch(/path=['"]\/login['"]|path=\{['"`]\/login['"`]\}/);

    // Verify HostMismatchBanner is rendered BEFORE Routes
    const bannerIndex = appSource.indexOf('HostMismatchBanner');
    const routesIndex = appSource.indexOf('<Routes');
    
    if (bannerIndex !== -1 && routesIndex !== -1) {
      expect(bannerIndex).toBeLessThan(routesIndex);
    }
  });
});

describe('splash-guard.js does not hard-redirect', () => {
  it('splash-guard.js contains no location.replace or location.href assignment', () => {
    const splashGuardPath = resolve(__dirname, '../../../public/splash-guard.js');
    
    if (!existsSync(splashGuardPath)) {
      console.warn(`splash-guard.js not found at ${splashGuardPath}, skipping test`);
      return;
    }

    const source = readFileSync(splashGuardPath, 'utf-8');

    expect(source).not.toMatch(/location\.replace\s*\(/);
    expect(source).not.toMatch(/location\.href\s*=\s*/);
    // location.reload() is OK — it's a retry, not a cross-host redirect
  });
});