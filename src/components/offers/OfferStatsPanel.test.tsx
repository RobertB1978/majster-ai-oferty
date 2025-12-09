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
