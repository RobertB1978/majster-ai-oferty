import { describe, it, expect } from 'vitest';
import i18n from '../../i18n';

/**
 * i18n Locale Completeness Tests
 *
 * These tests ensure that all locale files (PL, EN, UK) have complete translations
 * and prevent regression where translations go missing.
 */

describe('i18n Locale Completeness', () => {
  const criticalKeys = [
    'projects.searchPlaceholder',
    'projects.exportBtn',
    'projects.confirmDelete',
    'clients.confirmDelete',
    'clients.searchPlaceholder',
    'errors.pageNotFound',
    'errors.returnHome',
    'cookies.title',
    'cookies.acceptAll',
    'common.save',
    'common.cancel',
    'common.delete',
    'nav.dashboard',
    'nav.projects',
    'nav.clients',
    'nav.settings',
    'dashboard.title',
    'settings.title',
  ];

  describe('Polish (PL) translations', () => {
    criticalKeys.forEach(key => {
      it(`should have "${key}" translated in Polish`, () => {
        i18n.changeLanguage('pl');
        const translation = i18n.t(key);
        expect(translation).toBeTruthy();
        expect(translation).not.toBe(key); // Should not return the key itself
        expect(translation).not.toContain('.'); // Should not contain dots (raw key indicator)
      });
    });
  });

  describe('English (EN) translations', () => {
    criticalKeys.forEach(key => {
      it(`should have "${key}" translated in English`, () => {
        i18n.changeLanguage('en');
        const translation = i18n.t(key);
        expect(translation).toBeTruthy();
        expect(translation).not.toBe(key);
        expect(translation).not.toContain('.');
      });
    });
  });

  describe('Ukrainian (UK) translations', () => {
    criticalKeys.forEach(key => {
      it(`should have "${key}" translated in Ukrainian`, () => {
        i18n.changeLanguage('uk');
        const translation = i18n.t(key);
        expect(translation).toBeTruthy();
        expect(translation).not.toBe(key);
        expect(translation).not.toContain('.');
      });
    });
  });

  describe('Language switching consistency', () => {
    it('should switch languages correctly', () => {
      // Test Polish
      i18n.changeLanguage('pl');
      expect(i18n.t('common.save')).toBe('Zapisz');

      // Test English
      i18n.changeLanguage('en');
      expect(i18n.t('common.save')).toBe('Save');

      // Test Ukrainian
      i18n.changeLanguage('uk');
      expect(i18n.t('common.save')).toBe('Зберегти');
    });

    it('should translate critical user-reported keys consistently', () => {
      // projects.searchPlaceholder
      i18n.changeLanguage('pl');
      expect(i18n.t('projects.searchPlaceholder')).toBe('Szukaj projektów...');

      i18n.changeLanguage('en');
      expect(i18n.t('projects.searchPlaceholder')).toBe('Search projects...');

      i18n.changeLanguage('uk');
      expect(i18n.t('projects.searchPlaceholder')).toBe('Пошук проєктів...');

      // clients.confirmDelete
      i18n.changeLanguage('pl');
      expect(i18n.t('clients.confirmDelete')).toBe('Czy na pewno chcesz usunąć tego klienta?');

      i18n.changeLanguage('en');
      expect(i18n.t('clients.confirmDelete')).toBe('Are you sure you want to delete this client?');

      i18n.changeLanguage('uk');
      expect(i18n.t('clients.confirmDelete')).toBe('Ви впевнені, що хочете видалити цього клієнта?');
    });
  });
});
