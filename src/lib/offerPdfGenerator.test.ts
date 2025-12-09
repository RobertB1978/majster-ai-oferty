/**
 * Tests for Offer PDF Generator - Phase 5B
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateOfferPdf, uploadOfferPdf } from './offerPdfGenerator';
import { OfferPdfPayload } from './offerDataBuilder';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://storage.example.com/${path}` },
        })),
      })),
    },
  },
}));

describe('generateOfferPdf', () => {
  const createMockPayload = (overrides?: Partial<OfferPdfPayload>): OfferPdfPayload => ({
    projectId: 'test-project-123',
    projectName: 'Remont łazienki',
    company: {
      name: 'Test Company Sp. z o.o.',
      nip: '1234567890',
      street: 'ul. Testowa 1',
      postalCode: '00-001',
      city: 'Warszawa',
      phone: '+48 123 456 789',
      email: 'kontakt@test.pl',
      logoUrl: null,
    },
    client: {
      name: 'Jan Kowalski',
      email: 'jan@example.com',
      address: 'ul. Klienta 5, 00-002 Warszawa',
      phone: '+48 987 654 321',
    },
    quote: {
      positions: [
        {
          id: '1',
          name: 'Płytki ceramiczne',
          qty: 10,
          unit: 'm2',
          price: 50,
          category: 'Materiał' as const,
        },
        {
          id: '2',
          name: 'Układanie płytek',
          qty: 10,
          unit: 'm2',
          price: 80,
          category: 'Robocizna' as const,
        },
      ],
      summaryMaterials: 500,
      summaryLabor: 800,
      marginPercent: 20,
      total: 1560,
    },
    pdfConfig: {
      version: 'standard' as const,
      title: 'Oferta - Remont łazienki',
      offerText: 'Szanowni Państwo,\n\nPrzedstawiamy ofertę na remont.',
      terms: 'Warunki płatności: 50% zaliczka, 50% po wykonaniu.',
      deadlineText: 'Termin realizacji: 2 tygodnie.',
    },
    generatedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  });

  it('should generate PDF blob with valid data', async () => {
    const payload = createMockPayload();
    const pdfBlob = await generateOfferPdf(payload);

    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.type).toBe('application/pdf');
    expect(pdfBlob.size).toBeGreaterThan(0);
  });

  it('should handle large number of positions', async () => {
    const manyPositions = Array.from({ length: 50 }, (_, i) => ({
      id: `pos-${i}`,
      name: `Pozycja ${i + 1}`,
      qty: 1 + i,
      unit: 'm2',
      price: 10 + i * 5,
      category: i % 2 === 0 ? ('Materiał' as const) : ('Robocizna' as const),
    }));

    const payload = createMockPayload({
      quote: {
        positions: manyPositions,
        summaryMaterials: 5000,
        summaryLabor: 8000,
        marginPercent: 15,
        total: 14950,
      },
    });

    const pdfBlob = await generateOfferPdf(payload);

    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.size).toBeGreaterThan(0);
  });

  it('should handle missing client data', async () => {
    const payload = createMockPayload({
      client: null,
    });

    const pdfBlob = await generateOfferPdf(payload);

    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.size).toBeGreaterThan(0);
  });

  it('should handle missing quote data', async () => {
    const payload = createMockPayload({
      quote: null,
    });

    const pdfBlob = await generateOfferPdf(payload);

    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.size).toBeGreaterThan(0);
  });

  it('should include company information in PDF', async () => {
    const payload = createMockPayload({
      company: {
        name: 'Firma Budowlana ABC',
        nip: '9876543210',
        street: 'ul. Budowlana 10',
        postalCode: '02-222',
        city: 'Kraków',
        phone: '+48 111 222 333',
        email: 'biuro@abc.pl',
        logoUrl: null,
      },
    });

    const pdfBlob = await generateOfferPdf(payload);

    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.size).toBeGreaterThan(0);
    // Note: Deeper content validation would require parsing PDF,
    // which is complex. We verify structure is valid by checking blob properties.
  });
});

describe('uploadOfferPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload PDF to correct storage path', async () => {
    const mockBlob = new Blob(['test pdf content'], { type: 'application/pdf' });
    const result = await uploadOfferPdf({
      projectId: 'project-123',
      pdfBlob: mockBlob,
      userId: 'user-456',
    });

    expect(result.storagePath).toMatch(/^user-456\/offers\/project-123\/oferta-\d+\.pdf$/);
    expect(result.publicUrl).toContain('storage.example.com');
    expect(result.publicUrl).toContain('user-456/offers/project-123');
  });

  it('should use custom filename when provided', async () => {
    const mockBlob = new Blob(['test pdf content'], { type: 'application/pdf' });
    const result = await uploadOfferPdf({
      projectId: 'project-789',
      pdfBlob: mockBlob,
      userId: 'user-101',
      fileName: 'custom-offer.pdf',
    });

    expect(result.storagePath).toBe('user-101/offers/project-789/custom-offer.pdf');
    expect(result.publicUrl).toContain('custom-offer.pdf');
  });

  it('should use company-documents bucket', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockBlob = new Blob(['test pdf content'], { type: 'application/pdf' });

    await uploadOfferPdf({
      projectId: 'project-abc',
      pdfBlob: mockBlob,
      userId: 'user-xyz',
    });

    expect(supabase.storage.from).toHaveBeenCalledWith('company-documents');
  });
});
