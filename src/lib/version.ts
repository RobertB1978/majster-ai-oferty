/**
 * App version metadata — PR-01 Tooling Fundamentals
 *
 * __APP_VERSION__ is injected at build/test time by Vite `define`
 * (see vite.config.ts). Value comes from package.json `version` via
 * the `npm_package_version` env var that npm sets automatically.
 *
 * Usage:
 *   import { APP_VERSION } from '@/lib/version';
 *   console.info(`Running v${APP_VERSION}`);
 */
export const APP_VERSION: string = __APP_VERSION__;
export const APP_NAME = 'Majster.AI';
