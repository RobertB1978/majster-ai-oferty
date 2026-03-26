/**
 * Field Safety hooks — roadmap Field-Safe variants
 *
 * Three environment-aware hooks that adapt the UI to real field conditions:
 *
 * 1. useHighGlare()     — detects bright sunlight / high contrast preference
 * 2. useBatterySaver()  — detects low battery (<= 20%) or data-saver mode
 * 3. useReducedMotion() — respects prefers-reduced-motion (already in CSS,
 *                         this exposes it as a JS boolean for Framer Motion)
 *
 * Combined in useFieldSafety() — single import for components that need all three.
 *
 * CSS contract:
 *   [data-field="glare"]   — high-contrast mode active
 *   [data-field="battery"] — battery-saver mode active
 * Both are set on <html> for CSS overrides.
 */
import { useState, useEffect } from 'react';

/* ──────────────────────────────────────────────────────────────
   1. High-Glare Mode
   Triggers when:
   - prefers-contrast: more (iOS "Increase Contrast", Android Accessibility)
   - Screen brightness API not available in browsers — we use CSS media query
   ────────────────────────────────────────────────────────────── */
export function useHighGlare(): boolean {
  const [glare, setGlare] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: more)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-contrast: more)');
    const handler = (e: MediaQueryListEvent) => setGlare(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-field-glare', glare ? 'true' : 'false');
  }, [glare]);

  return glare;
}

/* ──────────────────────────────────────────────────────────────
   2. Battery Saver Mode
   Triggers when:
   - Battery level <= 20% (Navigator Battery API)
   - navigator.connection.saveData = true (Data Saver mode)
   - navigator.hardwareConcurrency <= 2 (very old/cheap device)
   ────────────────────────────────────────────────────────────── */

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
  addEventListener(type: 'levelchange' | 'chargingchange', listener: () => void): void;
  removeEventListener(type: 'levelchange' | 'chargingchange', listener: () => void): void;
}

declare global {
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
    connection?: { saveData?: boolean };
  }
}

const LOW_BATTERY_THRESHOLD = 0.20;
const LOW_CPU_THRESHOLD = 2;

function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  // Data Saver mode (Android Chrome)
  if (navigator.connection?.saveData) return true;
  // Very low CPU core count (very old/cheap device)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= LOW_CPU_THRESHOLD) return true;
  return false;
}

export function useBatterySaver(): boolean {
  const [saver, setSaver] = useState<boolean>(isLowEndDevice);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    let battery: BatteryManager | null = null;

    const update = () => {
      const lowBat = battery ? battery.level <= LOW_BATTERY_THRESHOLD && !battery.charging : false;
      setSaver(lowBat || isLowEndDevice());
    };

    if (typeof navigator.getBattery === 'function') {
      navigator.getBattery().then((b) => {
        battery = b;
        b.addEventListener('levelchange', update);
        b.addEventListener('chargingchange', update);
        update();
      }).catch(() => {
        // Battery API blocked or unavailable — safe fallback
        setSaver(isLowEndDevice());
      });
    }

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', update);
        battery.removeEventListener('chargingchange', update);
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-field-battery', saver ? 'true' : 'false');
  }, [saver]);

  return saver;
}

/* ──────────────────────────────────────────────────────────────
   3. Reduced Motion (JS bridge for Framer Motion)
   CSS already handles @media prefers-reduced-motion.
   This hook exposes the same boolean to JS/Framer Motion.
   ────────────────────────────────────────────────────────────── */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/* ──────────────────────────────────────────────────────────────
   4. Combined hook — use this in AppLayout
   ────────────────────────────────────────────────────────────── */
export interface FieldSafetyState {
  highGlare: boolean;
  batterySaver: boolean;
  reducedMotion: boolean;
  /** True if ANY field-safety mode is active — disables non-essential effects */
  anyFieldMode: boolean;
}

export function useFieldSafety(): FieldSafetyState {
  const highGlare = useHighGlare();
  const batterySaver = useBatterySaver();
  const reducedMotion = useReducedMotion();

  return {
    highGlare,
    batterySaver,
    reducedMotion,
    anyFieldMode: highGlare || batterySaver || reducedMotion,
  };
}
