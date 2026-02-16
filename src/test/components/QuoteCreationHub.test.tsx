import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteCreationHub } from '@/components/dashboard/QuoteCreationHub';
import { BrowserRouter } from 'react-router-dom';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.quoteCreation.title': 'Create Quote',
        'dashboard.quoteCreation.voiceTitle': 'Voice',
        'dashboard.quoteCreation.voiceDesc': 'Record voice quote',
        'dashboard.quoteCreation.aiTitle': 'AI Assistant',
        'dashboard.quoteCreation.aiDesc': 'AI-powered quote',
        'dashboard.quoteCreation.manualTitle': 'Manual',
        'dashboard.quoteCreation.manualDesc': 'Create manually',
        'dashboard.quoteCreation.chooseMethod': 'Choose your preferred method',
        'dashboard.quoteCreation.voiceStarting': 'Starting voice mode',
        'dashboard.quoteCreation.voiceRedirect': 'Redirecting...',
        'dashboard.quoteCreation.aiOpening': 'Opening AI assistant'
      };
      return translations[key] || key;
    }
  })
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn()
  }
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('QuoteCreationHub - Professional SaaS Cards', () => {
  it('renders three creation mode cards', () => {
    render(<QuoteCreationHub />, { wrapper: TestWrapper });

    expect(screen.getByText('Voice')).toBeDefined();
    expect(screen.getByText('AI Assistant')).toBeDefined();
    expect(screen.getByText('Manual')).toBeDefined();
  });

  it('displays card-based UI instead of circular buttons', () => {
    const { container } = render(<QuoteCreationHub />, { wrapper: TestWrapper });

    // Should NOT have circular button classes
    const circularButtons = container.querySelectorAll('.rounded-full.aspect-square');
    expect(circularButtons.length).toBe(0);

    // Should have card elements
    const cards = container.querySelectorAll('[class*="border-2"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('uses professional hover states without game-like scaling', () => {
    const { container } = render(<QuoteCreationHub />, { wrapper: TestWrapper });

    // Should NOT have game-like scale classes
    const scaleElements = container.querySelectorAll('[class*="hover:scale-110"]');
    expect(scaleElements.length).toBe(0);
  });

  it('renders icons in professional icon containers', () => {
    const { container } = render(<QuoteCreationHub />, { wrapper: TestWrapper });

    // Should have icon containers (rounded-xl backgrounds)
    const iconContainers = container.querySelectorAll('[class*="rounded-xl"]');
    expect(iconContainers.length).toBeGreaterThan(0);
  });

  it('displays descriptions for each creation mode', () => {
    render(<QuoteCreationHub />, { wrapper: TestWrapper });

    expect(screen.getByText('Record voice quote')).toBeDefined();
    expect(screen.getByText('AI-powered quote')).toBeDefined();
    expect(screen.getByText('Create manually')).toBeDefined();
  });

  it('shows helper text below cards', () => {
    render(<QuoteCreationHub />, { wrapper: TestWrapper });

    expect(screen.getByText('Choose your preferred method')).toBeDefined();
  });

  it('renders cards in responsive grid layout', () => {
    const { container } = render(<QuoteCreationHub />, { wrapper: TestWrapper });

    // Should have grid layout
    const gridContainer = container.querySelector('[class*="grid"]');
    expect(gridContainer).toBeDefined();
    expect(gridContainer?.className).toContain('grid-cols-1');
    expect(gridContainer?.className).toContain('sm:grid-cols-3');
  });

  it('uses semantic color scheme (destructive/primary/success)', () => {
    const { container } = render(<QuoteCreationHub />, { wrapper: TestWrapper });

    // Check for semantic color classes
    const content = container.innerHTML;
    expect(content).toContain('destructive'); // Voice
    expect(content).toContain('primary');     // AI
    expect(content).toContain('success');     // Manual
  });

  it('includes arrow indicators for each card', () => {
    render(<QuoteCreationHub />, { wrapper: TestWrapper });

    const startButtons = screen.getAllByText('Start');
    expect(startButtons.length).toBe(3);
  });
});
