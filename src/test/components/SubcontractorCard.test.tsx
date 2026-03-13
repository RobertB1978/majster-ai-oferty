import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubcontractorCard } from '@/components/marketplace/SubcontractorCard';
import type { Subcontractor } from '@/hooks/useSubcontractors';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

const mockSub: Subcontractor = {
  id: 'test-1',
  user_id: 'user-1',
  company_name: 'Firma Testowa',
  contact_name: 'Jan Kowalski',
  phone: '+48 600 000 000',
  email: 'jan@test.pl',
  description: 'Opis firmy',
  location_city: 'Warszawa',
  location_lat: null,
  location_lng: null,
  hourly_rate: 80,
  is_public: true,
  avatar_url: null,
  portfolio_images: [],
  rating: 4.5,
  review_count: 10,
  created_at: '2024-01-01T00:00:00Z',
};

describe('SubcontractorCard', () => {
  it('renders company name', () => {
    render(<SubcontractorCard subcontractor={mockSub} />);
    expect(screen.getByText('Firma Testowa')).toBeDefined();
  });

  it('does NOT render action buttons when callbacks are absent', () => {
    render(<SubcontractorCard subcontractor={mockSub} />);
    expect(screen.queryByText('marketplace.details')).toBeNull();
    expect(screen.queryByText('marketplace.invite')).toBeNull();
  });

  it('renders "Szczegóły" button via i18n fallback when onViewDetails provided', () => {
    render(<SubcontractorCard subcontractor={mockSub} onViewDetails={vi.fn()} />);
    expect(screen.getByText('marketplace.details')).toBeDefined();
  });

  it('renders "Zaproś" button via i18n fallback when onInvite provided', () => {
    render(<SubcontractorCard subcontractor={mockSub} onInvite={vi.fn()} />);
    expect(screen.getByText('marketplace.invite')).toBeDefined();
  });

  it('calls onViewDetails when Szczegóły button is clicked', () => {
    const handler = vi.fn();
    render(<SubcontractorCard subcontractor={mockSub} onViewDetails={handler} />);
    fireEvent.click(screen.getByText('marketplace.details'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('calls onInvite when Zaproś button is clicked', () => {
    const handler = vi.fn();
    render(<SubcontractorCard subcontractor={mockSub} onInvite={handler} />);
    fireEvent.click(screen.getByText('marketplace.invite'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('renders both buttons when both callbacks are provided', () => {
    render(
      <SubcontractorCard
        subcontractor={mockSub}
        onViewDetails={vi.fn()}
        onInvite={vi.fn()}
      />
    );
    expect(screen.getByText('marketplace.details')).toBeDefined();
    expect(screen.getByText('marketplace.invite')).toBeDefined();
  });
});
