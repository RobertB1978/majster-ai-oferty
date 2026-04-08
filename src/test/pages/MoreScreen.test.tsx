/**
 * MoreScreen.test.tsx
 *
 * Weryfikuje strukturę informacyjną ekranu "Więcej":
 *  - Dwie grupy (Narzędzia + Firma i konto)
 *  - Wpis "Gotowe dokumenty" widoczny gdy FF_READY_DOCUMENTS_ENABLED=true
 *  - Wpis "Gotowe dokumenty" ukryty gdy FF_READY_DOCUMENTS_ENABLED=false
 *  - Wpis "Wzory dokumentów" zawsze widoczny (niezależnie od flagi)
 *  - Kluczowe trasy dostępne jako przyciski (navigate po kliknięciu)
 *  - Ustawienia są w grupie konfiguracyjnej, nie wśród narzędzi operacyjnych
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// ---------- Mocks ----------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'pl' },
  }),
}));

// Mutowalny obiekt — vi.hoisted zapewnia dostępność przed wykonaniem vi.mock
const mockFlags = vi.hoisted(() => ({ FF_READY_DOCUMENTS_ENABLED: true }));
vi.mock('@/config/featureFlags', () => mockFlags);

// ---------- Komponent ----------

import MoreScreen from '@/pages/MoreScreen';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/app/more']}>{children}</MemoryRouter>
);

// ---------- Testy — flaga ON (domyślnie true) ----------

describe('MoreScreen — flaga FF_READY_DOCUMENTS_ENABLED=true', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFlags.FF_READY_DOCUMENTS_ENABLED = true;
  });

  it('renderuje nagłówek "Więcej"', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
  });

  it('renderuje dwie grupy (sekcje)', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const sections = screen.getAllByRole('region');
    expect(sections.length).toBe(2);
  });

  it('pierwsza grupa to "Narzędzia" z 7 elementami (Gotowe dokumenty włączone)', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const sections = screen.getAllByRole('region');
    const toolsSection = sections[0];

    const heading = toolsSection.querySelector('h2');
    expect(heading).not.toBeNull();

    // 7 przycisków: Kalendarz, Wzory dokumentów, Gotowe dokumenty, Finanse, Zdjęcia, Klienci, Zespół
    const buttons = toolsSection.querySelectorAll('button');
    expect(buttons.length).toBe(7);
  });

  it('druga grupa to "Firma i konto" z 2 elementami', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const sections = screen.getAllByRole('region');
    const accountSection = sections[1];

    const buttons = accountSection.querySelectorAll('button');
    expect(buttons.length).toBe(2);
  });

  it('łącznie 9 przycisków nawigacyjnych (7 narzędzia + 2 firmowe)', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(9);
  });

  it('wyświetla wpis "Gotowe dokumenty" w grupie Narzędzia', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const sections = screen.getAllByRole('region');
    const toolsSection = sections[0];

    const readyDocsBtn = Array.from(toolsSection.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('readyDocuments') || btn.textContent?.includes('Gotowe dokumenty')
    );
    expect(readyDocsBtn).not.toBeUndefined();
  });

  it('wyświetla wpis "Wzory dokumentów" w grupie Narzędzia', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const sections = screen.getAllByRole('region');
    const toolsSection = sections[0];

    const docTemplatesBtn = Array.from(toolsSection.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('documentTemplates') || btn.textContent?.includes('Wzory')
    );
    expect(docTemplatesBtn).not.toBeUndefined();
  });

  it('kliknięcie "Gotowe dokumenty" wywołuje navigate do /app/ready-documents', async () => {
    const user = userEvent.setup();
    render(<MoreScreen />, { wrapper: Wrapper });

    const buttons = screen.getAllByRole('button');
    const readyDocsBtn = buttons.find(btn =>
      btn.textContent?.includes('readyDocuments') || btn.textContent?.includes('Gotowe dokumenty')
    );
    expect(readyDocsBtn).not.toBeUndefined();
    await user.click(readyDocsBtn!);
    expect(mockNavigate).toHaveBeenCalledWith('/app/ready-documents');
  });

  it('kliknięcie "Wzory dokumentów" wywołuje navigate do /app/document-templates', async () => {
    const user = userEvent.setup();
    render(<MoreScreen />, { wrapper: Wrapper });

    const buttons = screen.getAllByRole('button');
    const docTemplatesBtn = buttons.find(btn =>
      btn.textContent?.includes('documentTemplates') || btn.textContent?.includes('Wzory')
    );
    expect(docTemplatesBtn).not.toBeUndefined();
    await user.click(docTemplatesBtn!);
    expect(mockNavigate).toHaveBeenCalledWith('/app/document-templates');
  });

  it('Ustawienia są w drugiej grupie ("Firma i konto"), nie w pierwszej', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const sections = screen.getAllByRole('region');

    const toolsSection = sections[0];
    const accountSection = sections[1];

    const toolsButtons = Array.from(toolsSection.querySelectorAll('button'));
    const accountButtons = Array.from(accountSection.querySelectorAll('button'));

    const settingsInTools = toolsButtons.some(btn =>
      btn.textContent?.includes('settings') || btn.textContent?.includes('Ustawienia')
    );
    const settingsInAccount = accountButtons.some(btn =>
      btn.textContent?.includes('settings') || btn.textContent?.includes('Ustawienia')
    );

    expect(settingsInTools).toBe(false);
    expect(settingsInAccount).toBe(true);
  });

  it('kliknięcie Kalendarza wywołuje navigate do /app/calendar', async () => {
    const user = userEvent.setup();
    render(<MoreScreen />, { wrapper: Wrapper });

    const buttons = screen.getAllByRole('button');
    const calendarBtn = buttons.find(btn =>
      btn.textContent?.includes('calendar') || btn.textContent?.includes('Kalendarz')
    );
    expect(calendarBtn).not.toBeUndefined();
    await user.click(calendarBtn!);
    expect(mockNavigate).toHaveBeenCalledWith('/app/calendar');
  });

  it('kliknięcie Ustawień wywołuje navigate do /app/settings', async () => {
    const user = userEvent.setup();
    render(<MoreScreen />, { wrapper: Wrapper });

    const buttons = screen.getAllByRole('button');
    const settingsBtn = buttons.find(btn =>
      btn.textContent?.includes('settings') || btn.textContent?.includes('Ustawienia')
    );
    expect(settingsBtn).not.toBeUndefined();
    await user.click(settingsBtn!);
    expect(mockNavigate).toHaveBeenCalledWith('/app/settings');
  });

  it('kliknięcie Profilu firmy wywołuje navigate do /app/profile', async () => {
    const user = userEvent.setup();
    render(<MoreScreen />, { wrapper: Wrapper });

    const buttons = screen.getAllByRole('button');
    const profileBtn = buttons.find(btn =>
      btn.textContent?.includes('profile') || btn.textContent?.includes('Profil')
    );
    expect(profileBtn).not.toBeUndefined();
    await user.click(profileBtn!);
    expect(mockNavigate).toHaveBeenCalledWith('/app/profile');
  });
});

// ---------- Testy — flaga OFF ----------

describe('MoreScreen — flaga FF_READY_DOCUMENTS_ENABLED=false', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFlags.FF_READY_DOCUMENTS_ENABLED = false;
  });

  afterEach(() => {
    // Przywróć domyślną wartość flagi po każdym teście
    mockFlags.FF_READY_DOCUMENTS_ENABLED = true;
  });

  it('pierwsza grupa ma 6 elementów (Gotowe dokumenty ukryte)', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const sections = screen.getAllByRole('region');
    const toolsSection = sections[0];

    const buttons = toolsSection.querySelectorAll('button');
    expect(buttons.length).toBe(6);
  });

  it('łącznie 8 przycisków (6 narzędzia + 2 firmowe)', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(8);
  });

  it('NIE wyświetla wpisu "Gotowe dokumenty"', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const buttons = screen.getAllByRole('button');

    const readyDocsBtn = buttons.find(btn =>
      btn.textContent?.includes('readyDocuments') || btn.textContent?.includes('Gotowe dokumenty')
    );
    expect(readyDocsBtn).toBeUndefined();
  });

  it('nadal wyświetla wpis "Wzory dokumentów"', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const buttons = screen.getAllByRole('button');

    const docTemplatesBtn = buttons.find(btn =>
      btn.textContent?.includes('documentTemplates') || btn.textContent?.includes('Wzory')
    );
    expect(docTemplatesBtn).not.toBeUndefined();
  });

  it('kliknięcie "Wzory dokumentów" nadal nawiguje do /app/document-templates', async () => {
    const user = userEvent.setup();
    render(<MoreScreen />, { wrapper: Wrapper });

    const buttons = screen.getAllByRole('button');
    const docTemplatesBtn = buttons.find(btn =>
      btn.textContent?.includes('documentTemplates') || btn.textContent?.includes('Wzory')
    );
    expect(docTemplatesBtn).not.toBeUndefined();
    await user.click(docTemplatesBtn!);
    expect(mockNavigate).toHaveBeenCalledWith('/app/document-templates');
  });
});
