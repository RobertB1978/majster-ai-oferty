import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

/**
 * No Raw Keys Tests
 *
 * These tests ensure that no raw translation keys (like "projects.searchPlaceholder")
 * are visible in the rendered UI. All keys should be properly translated.
 */

// Helper to wrap components with necessary providers
function renderWithProviders(ui: React.ReactElement, { locale = 'pl' } = {}) {
  // Change language before rendering
  i18n.changeLanguage(locale);

  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        {ui}
      </I18nextProvider>
    </MemoryRouter>
  );
}

// Helper to detect raw translation keys
function hasRawKeys(text: string): boolean {
  // Pattern: word.word (like "projects.searchPlaceholder")
  // But exclude valid text like "example.com" or numbers like "1.5"
  const rawKeyPattern = /\b[a-z]+\.[a-z]+/i;
  return rawKeyPattern.test(text);
}

function getAllTextContent(container: HTMLElement): string {
  return container.textContent || '';
}

describe('No Raw Keys in UI', () => {
  beforeEach(() => {
    // Reset to Polish before each test
    i18n.changeLanguage('pl');
  });

  describe('Raw key detection helper', () => {
    it('should detect raw keys', () => {
      expect(hasRawKeys('projects.searchPlaceholder')).toBe(true);
      expect(hasRawKeys('clients.confirmDelete')).toBe(true);
      expect(hasRawKeys('errors.pageNotFound')).toBe(true);
    });

    it('should not detect valid text', () => {
      expect(hasRawKeys('Szukaj projektów')).toBe(false);
      expect(hasRawKeys('Search projects')).toBe(false);
      expect(hasRawKeys('example.com')).toBe(false);
      expect(hasRawKeys('1.5')).toBe(false);
      expect(hasRawKeys('john@example.pl')).toBe(false);
    });
  });

  describe('Common UI elements', () => {
    it('should not show raw keys in button labels (PL)', () => {
      const { container } = renderWithProviders(
        <div>
          <button>{i18n.t('common.save')}</button>
          <button>{i18n.t('common.cancel')}</button>
          <button>{i18n.t('common.delete')}</button>
        </div>
      );

      expect(screen.getByText('Zapisz')).toBeInTheDocument();
      expect(screen.getByText('Anuluj')).toBeInTheDocument();
      expect(screen.getByText('Usuń')).toBeInTheDocument();

      const allText = getAllTextContent(container);
      expect(allText).not.toContain('common.save');
      expect(allText).not.toContain('common.cancel');
      expect(allText).not.toContain('common.delete');
    });

    it('should not show raw keys in button labels (EN)', () => {
      const { container } = renderWithProviders(
        <div>
          <button>{i18n.t('common.save')}</button>
          <button>{i18n.t('common.cancel')}</button>
          <button>{i18n.t('common.delete')}</button>
        </div>,
        { locale: 'en' }
      );

      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();

      const allText = getAllTextContent(container);
      expect(allText).not.toContain('common.save');
      expect(allText).not.toContain('common.cancel');
      expect(allText).not.toContain('common.delete');
    });

    it('should not show raw keys in button labels (UK)', () => {
      const { container } = renderWithProviders(
        <div>
          <button>{i18n.t('common.save')}</button>
          <button>{i18n.t('common.cancel')}</button>
          <button>{i18n.t('common.delete')}</button>
        </div>,
        { locale: 'uk' }
      );

      expect(screen.getByText('Зберегти')).toBeInTheDocument();
      expect(screen.getByText('Скасувати')).toBeInTheDocument();
      expect(screen.getByText('Видалити')).toBeInTheDocument();

      const allText = getAllTextContent(container);
      expect(allText).not.toContain('common.save');
      expect(allText).not.toContain('common.cancel');
      expect(allText).not.toContain('common.delete');
    });
  });

  describe('Critical user-reported keys', () => {
    it('should translate projects.searchPlaceholder in all languages', () => {
      // Polish
      i18n.changeLanguage('pl');
      expect(i18n.t('projects.searchPlaceholder')).toBe('Szukaj projektów...');
      expect(i18n.t('projects.searchPlaceholder')).not.toContain('.');

      // English
      i18n.changeLanguage('en');
      expect(i18n.t('projects.searchPlaceholder')).toBe('Search projects...');

      // Ukrainian
      i18n.changeLanguage('uk');
      expect(i18n.t('projects.searchPlaceholder')).toBe('Пошук проєктів...');
    });

    it('should translate projects.exportBtn in all languages', () => {
      // Polish
      i18n.changeLanguage('pl');
      expect(i18n.t('projects.exportBtn')).toBe('Eksportuj CSV');

      // English
      i18n.changeLanguage('en');
      expect(i18n.t('projects.exportBtn')).toBe('Export CSV');

      // Ukrainian
      i18n.changeLanguage('uk');
      expect(i18n.t('projects.exportBtn')).toBe('Експорт CSV');
    });

    it('should translate clients.confirmDelete in all languages', () => {
      // Polish
      i18n.changeLanguage('pl');
      expect(i18n.t('clients.confirmDelete')).toBe('Czy na pewno chcesz usunąć tego klienta?');

      // English
      i18n.changeLanguage('en');
      expect(i18n.t('clients.confirmDelete')).toBe('Are you sure you want to delete this client?');

      // Ukrainian
      i18n.changeLanguage('uk');
      expect(i18n.t('clients.confirmDelete')).toBe('Ви впевнені, що хочете видалити цього клієнта?');
    });

    it('should translate errors.pageNotFound in all languages', () => {
      // Polish
      i18n.changeLanguage('pl');
      expect(i18n.t('errors.pageNotFound')).toBe('Strona nie została znaleziona');

      // English
      i18n.changeLanguage('en');
      expect(i18n.t('errors.pageNotFound')).toBe('Page not found');

      // Ukrainian
      i18n.changeLanguage('uk');
      expect(i18n.t('errors.pageNotFound')).toBe('Сторінку не знайдено');
    });

    it('should translate cookies.title in all languages', () => {
      // Polish
      i18n.changeLanguage('pl');
      expect(i18n.t('cookies.title')).toBe('Ustawienia plików cookies');

      // English
      i18n.changeLanguage('en');
      expect(i18n.t('cookies.title')).toBe('Cookie settings');

      // Ukrainian
      i18n.changeLanguage('uk');
      expect(i18n.t('cookies.title')).toBe('Налаштування cookies');
    });
  });

  describe('Language switching consistency', () => {
    it('should change all UI text when switching languages', () => {
      const TestComponent = () => (
        <div>
          <h1>{i18n.t('nav.dashboard')}</h1>
          <p>{i18n.t('nav.projects')}</p>
          <p>{i18n.t('nav.clients')}</p>
        </div>
      );

      // Render in Polish
      const { container, rerender } = renderWithProviders(<TestComponent />, { locale: 'pl' });
      expect(getAllTextContent(container)).toContain('Dashboard');
      expect(getAllTextContent(container)).toContain('Projekty');
      expect(getAllTextContent(container)).toContain('Klienci');

      // Switch to English
      i18n.changeLanguage('en');
      rerender(
        <MemoryRouter>
          <I18nextProvider i18n={i18n}>
            <TestComponent />
          </I18nextProvider>
        </MemoryRouter>
      );
      expect(getAllTextContent(container)).toContain('Dashboard');
      expect(getAllTextContent(container)).toContain('Projects');
      expect(getAllTextContent(container)).toContain('Clients');

      // Switch to Ukrainian
      i18n.changeLanguage('uk');
      rerender(
        <MemoryRouter>
          <I18nextProvider i18n={i18n}>
            <TestComponent />
          </I18nextProvider>
        </MemoryRouter>
      );
      expect(getAllTextContent(container)).toContain('Панель');
      expect(getAllTextContent(container)).toContain('Проєкти');
      expect(getAllTextContent(container)).toContain('Клієнти');
    });

    it('should not mix languages when switching', () => {
      const TestComponent = () => (
        <div>
          <button>{i18n.t('common.save')}</button>
          <button>{i18n.t('common.cancel')}</button>
        </div>
      );

      // Test Polish - should not contain English or Ukrainian
      i18n.changeLanguage('pl');
      const { container } = renderWithProviders(<TestComponent />);
      const plText = getAllTextContent(container);
      expect(plText).toContain('Zapisz');
      expect(plText).toContain('Anuluj');
      expect(plText).not.toContain('Save');
      expect(plText).not.toContain('Cancel');
      expect(plText).not.toContain('Зберегти');
      expect(plText).not.toContain('Скасувати');
    });
  });
});
