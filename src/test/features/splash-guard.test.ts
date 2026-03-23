/**
 * Tests for the splash-guard.js progressive feedback mechanism.
 *
 * splash-guard.js runs as a plain <script> in index.html. It uses setTimeout
 * to progressively inform the user when React fails to mount.
 *
 * These tests verify:
 * 1. Stage 1 (3s): "Ładowanie aplikacji…" hint appears
 * 2. Stage 2 (6s): "Trwa to dłużej niż zwykle…" warning
 * 3. Stage 3 (10s): Error message + reload button + host info
 * 4. Stage 3 on www host: Shows link to canonical domain
 * 5. No feedback if React mounted (splash removed before timeouts)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read the actual splash-guard.js source
const splashGuardSource = readFileSync(
  resolve(__dirname, '../../../public/splash-guard.js'),
  'utf-8'
);

function createSplashDOM() {
  document.body.innerHTML = `
    <div id="root">
      <div id="app-splash">
        <div id="app-splash-icon"></div>
        <div id="app-splash-title">Majster.AI</div>
        <div id="app-splash-dot"></div>
      </div>
    </div>
  `;
}

describe('splash-guard.js', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    createSplashDOM();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  function runSplashGuard() {
    // Execute the splash guard script in current context
    eval(splashGuardSource);
  }

  it('shows "Ładowanie aplikacji…" hint after 3 seconds', () => {
    runSplashGuard();

    vi.advanceTimersByTime(3000);

    const hint = document.getElementById('splash-hint-1');
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain('Ładowanie aplikacji');
  });

  it('shows "Trwa to dłużej…" warning after 6 seconds and hides dot', () => {
    runSplashGuard();

    vi.advanceTimersByTime(6000);

    // Stage 1 hint should be removed
    expect(document.getElementById('splash-hint-1')).toBeNull();
    // Stage 2 should be visible
    const hint2 = document.getElementById('splash-hint-2');
    expect(hint2).not.toBeNull();
    expect(hint2!.textContent).toContain('Trwa to dłużej');
    // Pulsing dot should be hidden
    expect(document.getElementById('app-splash-dot')!.style.display).toBe('none');
  });

  it('shows error + reload button after 10 seconds with host info', () => {
    runSplashGuard();

    vi.advanceTimersByTime(10000);

    const splash = document.getElementById('app-splash')!;
    expect(splash.textContent).toContain('Aplikacja nie załadowała się poprawnie');
    expect(splash.textContent).toContain('Host:');

    // Reload button exists
    const button = splash.querySelector('button');
    expect(button).not.toBeNull();
    expect(button!.textContent).toContain('Odśwież stronę');
  });

  it('shows canonical domain link when on www subdomain', () => {
    // Mock window.location.host to www.majsterai.com
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        host: 'www.majsterai.com',
        protocol: 'https:',
        pathname: '/login',
        reload: vi.fn(),
      },
    });

    runSplashGuard();
    vi.advanceTimersByTime(10000);

    const splash = document.getElementById('app-splash')!;
    const link = splash.querySelector('a');
    expect(link).not.toBeNull();
    expect(link!.textContent).toContain('majsterai.com');
    expect(link!.href).toContain('https://majsterai.com/login');
  });

  it('does NOT show any hints if splash is already removed (React mounted)', () => {
    runSplashGuard();

    // Simulate React mounting — remove splash
    const splash = document.getElementById('app-splash')!;
    splash.remove();

    // Advance past all stages
    vi.advanceTimersByTime(15000);

    // Nothing should have been added to DOM
    expect(document.getElementById('splash-hint-1')).toBeNull();
    expect(document.getElementById('splash-hint-2')).toBeNull();
    expect(document.body.textContent).not.toContain('Aplikacja nie załadowała się');
  });
});
