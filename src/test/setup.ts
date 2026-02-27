import '@testing-library/jest-dom';
import { vi } from 'vitest';
import i18n from '@/i18n';
import enJson from '@/i18n/locales/en.json';
import ukJson from '@/i18n/locales/uk.json';

// Pre-load all language bundles synchronously so that tests can call
// i18n.changeLanguage('en'/'uk') and immediately use i18n.t() without
// waiting for the lazy-loading async import to resolve.
// (Production code uses lazy loading for bundle-size savings; tests need
// everything available synchronously.)
i18n.addResourceBundle('en', 'translation', enJson, true, true);
i18n.addResourceBundle('uk', 'translation', ukJson, true, true);

// Initialize i18n with Polish locale for tests
i18n.changeLanguage('pl');

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});
