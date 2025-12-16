/**
 * Accessibility Tests - Security Pack Δ1 - PROMPT 4/10
 * Automated a11y checks to prevent WCAG regressions
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('login page should not have critical a11y violations', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Fail on critical violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('home page should not have critical a11y violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Fail on critical violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
