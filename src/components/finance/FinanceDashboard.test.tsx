import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FinanceDashboard } from './FinanceDashboard';

// Mock hooks
vi.mock('@/hooks/useFinancialReports', () => ({
  useFinancialSummary: vi.fn(),
  useAIFinancialAnalysis: vi.fn(),
}));

// Mock Recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Area: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

// Mock LoadingCard
vi.mock('@/components/ui/loading-screen', () => ({
  LoadingCard: () => <div data-testid="loading-card" />,
}));

import { useFinancialSummary, useAIFinancialAnalysis } from '@/hooks/useFinancialReports';

const mockAIAnalysis = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockSummaryWithData = {
  totalRevenue: 50000,
  totalCosts: 30000,
  grossMargin: 20000,
  marginPercent: 40,
  projectCount: 3,
  monthly: [
    { month: '2025-01', revenue: 20000, costs: 12000, margin: 8000 },
    { month: '2025-02', revenue: 30000, costs: 18000, margin: 12000 },
  ],
  projects: [],
  quotes: [],
  costs: [],
};

const mockSummaryEmpty = {
  totalRevenue: 0,
  totalCosts: 0,
  grossMargin: 0,
  marginPercent: 0,
  projectCount: 0,
  monthly: [],
  projects: [],
  quotes: [],
  costs: [],
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('FinanceDashboard', () => {
  beforeEach(() => {
    vi.mocked(useAIFinancialAnalysis).mockReturnValue(mockAIAnalysis as ReturnType<typeof useAIFinancialAnalysis>);
  });

  it('wyświetla skeleton podczas ładowania', () => {
    vi.mocked(useFinancialSummary).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useFinancialSummary>);

    render(<FinanceDashboard />, { wrapper: TestWrapper });

    const loadingCards = screen.getAllByTestId('loading-card');
    expect(loadingCards.length).toBe(4);
  });

  it('wyświetla empty state gdy brak danych finansowych', () => {
    vi.mocked(useFinancialSummary).mockReturnValue({
      data: mockSummaryEmpty,
      isLoading: false,
    } as ReturnType<typeof useFinancialSummary>);

    render(<FinanceDashboard />, { wrapper: TestWrapper });

    expect(screen.getByText('Brak danych finansowych')).toBeDefined();
    expect(
      screen.getByText('Stwórz projekty i wyceny, aby śledzić swoje przychody, koszty i marżę w czasie.')
    ).toBeDefined();
    expect(screen.getByRole('button', { name: 'Utwórz pierwszy projekt' })).toBeDefined();
  });

  it('nie wyświetla wykresów w empty state', () => {
    vi.mocked(useFinancialSummary).mockReturnValue({
      data: mockSummaryEmpty,
      isLoading: false,
    } as ReturnType<typeof useFinancialSummary>);

    render(<FinanceDashboard />, { wrapper: TestWrapper });

    expect(screen.queryByTestId('area-chart')).toBeNull();
    expect(screen.queryByTestId('bar-chart')).toBeNull();
  });

  it('wyświetla wykresy gdy są dane finansowe', () => {
    vi.mocked(useFinancialSummary).mockReturnValue({
      data: mockSummaryWithData,
      isLoading: false,
    } as ReturnType<typeof useFinancialSummary>);

    render(<FinanceDashboard />, { wrapper: TestWrapper });

    expect(screen.getByTestId('area-chart')).toBeDefined();
    expect(screen.getByTestId('bar-chart')).toBeDefined();
  });

  it('wyświetla karty KPI z danymi finansowymi', () => {
    vi.mocked(useFinancialSummary).mockReturnValue({
      data: mockSummaryWithData,
      isLoading: false,
    } as ReturnType<typeof useFinancialSummary>);

    render(<FinanceDashboard />, { wrapper: TestWrapper });

    expect(screen.getByText('Przychody')).toBeDefined();
    expect(screen.getByText('Koszty')).toBeDefined();
    expect(screen.getByText('Marża brutto')).toBeDefined();
    expect(screen.getByText('Marża %')).toBeDefined();
  });

  it('wyświetla sekcję analizy AI z przyciskiem uruchomienia', () => {
    vi.mocked(useFinancialSummary).mockReturnValue({
      data: mockSummaryWithData,
      isLoading: false,
    } as ReturnType<typeof useFinancialSummary>);

    render(<FinanceDashboard />, { wrapper: TestWrapper });

    expect(screen.getByText('Analiza AI')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Uruchom analizę' })).toBeDefined();
  });
});
