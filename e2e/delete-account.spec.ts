/**
 * Delete Account E2E Tests - Security Pack Δ1 - PROMPT 5/10
 * Tests the complete account deletion flow
 */

import { test, expect } from '@playwright/test';

test.describe('Delete Account Flow', () => {
  test.skip('UI should show delete account option in settings', async ({ page }) => {
    // This test requires authentication - skip in smoke tests
    // TODO: Implement with auth setup when test user available

    await page.goto('/settings');

    // Should have delete account section
    const deleteSection = page.getByText(/delete.*account/i);
    await expect(deleteSection).toBeVisible();
  });

  test.skip('should require confirmation phrase', async ({ page }) => {
    // This test requires authentication - skip in smoke tests
    // TODO: Implement with auth setup

    await page.goto('/settings');

    // Click delete account button
    const deleteButton = page.getByRole('button', { name: /delete.*account/i });
    await deleteButton.click();

    // Should show confirmation dialog
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();

    // Should require exact phrase
    const phraseInput = page.getByPlaceholder(/DELETE MY ACCOUNT/i);
    await expect(phraseInput).toBeVisible();
  });

  test.skip('should prevent deletion without correct phrase', async ({ page }) => {
    // This test requires authentication - skip in smoke tests
    // TODO: Implement with auth setup

    await page.goto('/settings');

    const deleteButton = page.getByRole('button', { name: /delete.*account/i });
    await deleteButton.click();

    // Try with wrong phrase
    const phraseInput = page.getByPlaceholder(/DELETE MY ACCOUNT/i);
    await phraseInput.fill('delete my account'); // wrong case

    const confirmButton = page.getByRole('button', { name: /confirm/i });
    await confirmButton.click();

    // Should show error
    const errorMessage = page.getByText(/confirmation phrase must be exactly/i);
    await expect(errorMessage).toBeVisible();
  });
});
