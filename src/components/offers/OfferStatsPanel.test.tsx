/**
 * Tests for OfferStatsPanel - Phase 6A
 * Tests statistics display for offers
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfferStatsPanel } from './OfferStatsPanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfferStats } from '@/hooks/useOfferStats';

// Mock the useOfferStats hook
const mockUseOfferStats = vi.fn();
vi.mock('@/hooks/useOfferStats', () => ({
  useOfferStats: () => mockUseOfferStats(),
}));

describe('OfferStatsPanel', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderPanel = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <OfferStatsPanel />
      </QueryClientProvider>
    );
  };

  it('should display all three stat cards with correct values', () => {
    const mockStats: OfferStats = {
      sentCount: 15,
      acceptedCount: 8,
      conversionRate: 53,
    };

    mockUseOfferStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    renderPanel();

    // Check "Wysłane oferty" card
    expect(screen.getByText('Wysłane oferty')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    // Check "Zaakceptowane oferty" card
    expect(screen.getByText('Zaakceptowane oferty')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();

    // Check "Konwersja" card
    expect(screen.getByText('Konwersja')).toBeInTheDocument();
    expect(screen.getByText('53%')).toBeInTheDocument();

    // Check descriptions
    const descriptions = screen.getAllByText('Ostatnie 30 dni');
    expect(descriptions).toHaveLength(2); // For sent and accepted cards

    expect(screen.getByText('Zaakceptowane / Wysłane')).toBeInTheDocument();
  });

  it('should display zero values when no offers exist', () => {
    const mockStats: OfferStats = {
      sentCount: 0,
      acceptedCount: 0,
      conversionRate: 0,
    };

    mockUseOfferStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    renderPanel();

    expect(screen.getByText('Wysłane oferty')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should show loading state with skeleton cards', () => {
    mockUseOfferStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderPanel();

    // Should render 3 loading cards (with loader icons)
    const loaders = document.querySelectorAll('.animate-spin');
    expect(loaders).toHaveLength(3);
  });

  it('should not render when there is an error', () => {
    mockUseOfferStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch stats'),
    });

    const { container } = renderPanel();

    // Should fail silently - no content
    expect(container).toBeEmptyDOMElement();
  });

  it('should not render when data is null', () => {
    mockUseOfferStats.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { container } = renderPanel();

    expect(container).toBeEmptyDOMElement();
  });

  it('should display 100% conversion rate correctly', () => {
    const mockStats: OfferStats = {
      sentCount: 10,
      acceptedCount: 10,
      conversionRate: 100,
    };

    mockUseOfferStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    renderPanel();

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should have proper grid layout for responsive design', () => {
    const mockStats: OfferStats = {
      sentCount: 5,
      acceptedCount: 2,
      conversionRate: 40,
    };

    mockUseOfferStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    const { container } = renderPanel();

    // Check if grid container has correct classes
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid', 'gap-4', 'md:grid-cols-3');
  });
});

describe('OfferStatsPanel - Phase 6C Follow-up Statistics', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderPanel = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <OfferStatsPanel />
      </QueryClientProvider>
    );
  };

  it('should display follow-up section with all statistics', () => {
    const mockStats: OfferStats = {
      sentCount: 20,
      acceptedCount: 8,
      conversionRate: 40,
      followupCount: 5,
      followupNotOpened: 3,
      followupOpenedNoDecision: 2,
    };

    mockUseOfferStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    renderPanel();

    // Check follow-up section header
    expect(screen.getByText('Oferty wymagające follow-up')).toBeInTheDocument();

    // Check total follow-up count
    expect(screen.getByText('Razem')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Check not opened count
    expect(screen.getByText('Nieotwarte')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('email nie otwarty')).toBeInTheDocument();

    // Check opened no decision count
    expect(screen.getByText('Brak decyzji')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('otwarte, bez odpowiedzi')).toBeInTheDocument();
  });

  it('should display zero follow-up counts when no follow-ups needed', () => {
    const mockStats: OfferStats = {
      sentCount: 10,
      acceptedCount: 10,
      conversionRate: 100,
      followupCount: 0,
      followupNotOpened: 0,
      followupOpenedNoDecision: 0,
    };

    mockUseOfferStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    renderPanel();

    // All follow-up counts should be 0
    expect(screen.getByText('Razem')).toBeInTheDocument();
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(3);
  });

  it('should display correct plural form for single follow-up', () => {
    const mockStats: OfferStats = {
      sentCount: 10,
      acceptedCount: 5,
      conversionRate: 50,
      followupCount: 1,
      followupNotOpened: 1,
      followupOpenedNoDecision: 0,
    };

    mockUseOfferStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    renderPanel();

    // Should display "oferta wymaga" for singular
    expect(screen.getByText('oferta wymaga')).toBeInTheDocument();
    expect(screen.queryByText('ofert wymaga')).not.toBeInTheDocument();
  });

  it('should display correct plural form for multiple follow-ups', () => {
    const mockStats: OfferStats = {
      sentCount: 20,
      acceptedCount: 10,
      conversionRate: 50,
      followupCount: 7,
      followupNotOpened: 4,
      followupOpenedNoDecision: 3,
    };

    mockUseOfferStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    renderPanel();

    // Should display "ofert wymaga" for plural
    expect(screen.getByText('ofert wymaga')).toBeInTheDocument();
    expect(screen.queryByText('oferta wymaga')).not.toBeInTheDocument();
  });

  it('should display only not opened follow-ups', () => {
    const mockStats: OfferStats = {
      sentCount: 15,
      acceptedCount: 8,
      conversionRate: 53,
      followupCount: 4,
      followupNotOpened: 4,
      followupOpenedNoDecision: 0,
    };

    mockUseOfferStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    renderPanel();

    // Total and not opened should be 4
    expect(screen.getByText('4')).toBeInTheDocument();
    // Opened no decision should be 0
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should display only opened no decision follow-ups', () => {
    const mockStats: OfferStats = {
      sentCount: 15,
      acceptedCount: 8,
      conversionRate: 53,
      followupCount: 6,
      followupNotOpened: 0,
      followupOpenedNoDecision: 6,
    };

    mockUseOfferStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    renderPanel();

    // Total and opened no decision should be 6
    expect(screen.getByText('6')).toBeInTheDocument();
    // Not opened should be 0
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should have follow-up section in separate card', () => {
    const mockStats: OfferStats = {
      sentCount: 10,
      acceptedCount: 5,
      conversionRate: 50,
      followupCount: 3,
      followupNotOpened: 2,
      followupOpenedNoDecision: 1,
    };

    mockUseOfferStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    const { container } = renderPanel();

    // Should have space-y-4 container (basic stats + follow-up)
    const spaceContainer = container.querySelector('.space-y-4');
    expect(spaceContainer).toBeInTheDocument();

    // Follow-up section should be in a Card
    expect(screen.getByText('Oferty wymagające follow-up')).toBeInTheDocument();
  });
});
