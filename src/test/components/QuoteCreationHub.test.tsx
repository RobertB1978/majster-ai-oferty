import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuoteCreationHub } from '@/components/dashboard/QuoteCreationHub';
import { BrowserRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'dashboard.quoteCreation.title': 'Create Quote',
        'dashboard.quoteCreation.quickTitle': 'Szybka wycena',
        'dashboard.quoteCreation.quickDesc': 'Wprowadź pozycje i wyślij w kilka minut',
        'dashboard.quoteCreation.aiTitle': 'AI Assistant',
        'dashboard.quoteCreation.aiDesc': 'AI-powered quote',
        'dashboard.quoteCreation.manualTitle': 'Manual',
        'dashboard.quoteCreation.manualDesc': 'Create manually',
        'dashboard.quoteCreation.chooseMethod': 'Choose your preferred method',
      };
      return translations[key] ?? fallback ?? key;
    }
  })
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('QuoteCreationHub — honest affordances', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders three creation mode cards', () => {
    render(<QuoteCreationHub />, { wrapper: TestWrapper });

    expect(screen.getByText('Szybka wycena')).toBeDefined();
    expect(screen.getByText('AI Assistant')).toBeDefined();
    expect(screen.getByText('Manual')).toBeDefined();
  });

  it('does NOT render the old Voice / Mic card', () => {
    render(<QuoteCreationHub />, { wrapper: TestWrapper });

    expect(screen.queryByText('Voice')).toBeNull();
  });

  it('displays descriptions for each creation mode', () => {
    render(<QuoteCreationHub />, { wrapper: TestWrapper });

    expect(screen.getByText('Wprowadź pozycje i wyślij w kilka minut')).toBeDefined();
    expect(screen.getByText('AI-powered quote')).toBeDefined();
    expect(screen.getByText('Create manually')).toBeDefined();
  });

  it('shows helper text below cards', () => {
    render(<QuoteCreationHub />, { wrapper: TestWrapper });

    expect(screen.getByText('Choose your preferred method')).toBeDefined();
  });

  it('renders cards in responsive grid layout', () => {
    const { container } = render(<QuoteCreationHub />, { wrapper: TestWrapper });

    const gridContainer = container.querySelector('[class*="grid"]');
    expect(gridContainer).toBeDefined();
    expect(gridContainer?.className).toContain('grid-cols-1');
    expect(gridContainer?.className).toContain('sm:grid-cols-3');
  });

  it('does NOT have circular button classes (professional UI)', () => {
    const { container } = render(<QuoteCreationHub />, { wrapper: TestWrapper });

    const circularButtons = container.querySelectorAll('.rounded-full.aspect-square');
    expect(circularButtons.length).toBe(0);
  });

  it('does NOT have game-like scale hover classes', () => {
    const { container } = render(<QuoteCreationHub />, { wrapper: TestWrapper });

    const scaleElements = container.querySelectorAll('[class*="hover:scale-110"]');
    expect(scaleElements.length).toBe(0);
  });

  it('renders icon containers (rounded-xl backgrounds)', () => {
    const { container } = render(<QuoteCreationHub />, { wrapper: TestWrapper });

    const iconContainers = container.querySelectorAll('[class*="rounded-xl"]');
    expect(iconContainers.length).toBeGreaterThan(0);
  });

  it('includes arrow indicators for each card', () => {
    render(<QuoteCreationHub />, { wrapper: TestWrapper });

    const startButtons = screen.getAllByText('Start');
    expect(startButtons.length).toBe(3);
  });

  describe('CTA navigation — routing honesty', () => {
    it('"Szybka wycena" naviguje do /app/szybka-wycena (inny flow niż kreator ofert)', () => {
      render(<QuoteCreationHub />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByText('Szybka wycena'));

      expect(mockNavigate).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith('/app/szybka-wycena');
    });

    it('"AI Assistant" naviguje do /app/offers/new', () => {
      render(<QuoteCreationHub />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByText('AI Assistant'));

      expect(mockNavigate).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith('/app/offers/new');
    });

    it('"Manual" naviguje do /app/offers/new', () => {
      render(<QuoteCreationHub />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByText('Manual'));

      expect(mockNavigate).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith('/app/offers/new');
    });

    it('"Szybka wycena" i "Manual" prowadzą do RÓŻNYCH tras (brak identycznych CTA)', () => {
      render(<QuoteCreationHub />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByText('Szybka wycena'));
      const quickPath = mockNavigate.mock.calls[0][0];

      mockNavigate.mockClear();
      render(<QuoteCreationHub />, { wrapper: TestWrapper });
      fireEvent.click(screen.getAllByText('Manual')[0]);
      const manualPath = mockNavigate.mock.calls[0][0];

      expect(quickPath).not.toBe(manualPath);
    });
  });
});
