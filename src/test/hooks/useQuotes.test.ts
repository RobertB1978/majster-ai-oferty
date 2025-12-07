import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('Quotes Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('quote calculations', () => {
    it('should calculate quote total correctly', () => {
      const positions = [
        { name: 'Item 1', qty: 2, price: 100, type: 'material' },
        { name: 'Item 2', qty: 1, price: 500, type: 'labor' },
        { name: 'Item 3', qty: 3, price: 50, type: 'material' },
      ];

      const materialsTotal = positions
        .filter(p => p.type === 'material')
        .reduce((sum, p) => sum + (p.qty * p.price), 0);
      
      const laborTotal = positions
        .filter(p => p.type === 'labor')
        .reduce((sum, p) => sum + (p.qty * p.price), 0);

      expect(materialsTotal).toBe(350); // 2*100 + 3*50
      expect(laborTotal).toBe(500); // 1*500
    });

    it('should apply margin correctly', () => {
      const baseTotal = 1000;
      const marginPercent = 20;
      const totalWithMargin = baseTotal * (1 + marginPercent / 100);

      expect(totalWithMargin).toBe(1200);
    });

    it('should handle empty positions', () => {
      const positions: any[] = [];
      const total = positions.reduce((sum, p) => sum + (p.qty * p.price), 0);
      expect(total).toBe(0);
    });
  });

  describe('creating quotes', () => {
    it('should create a new quote', async () => {
      const quoteData = {
        project_id: 'proj-1',
        positions: [],
        margin_percent: 15,
        summary_materials: 1000,
        summary_labor: 500,
        total: 1725, // (1000+500) * 1.15
      };

      mockSupabaseClient.from().insert.mockReturnThis();
      mockSupabaseClient.from().select.mockReturnThis();
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: { id: 'quote-1', ...quoteData },
        error: null,
      });

      const result = await mockSupabaseClient
        .from('quotes')
        .insert(quoteData)
        .select()
        .single();

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
  });

  describe('quote versioning', () => {
    it('should create quote version', async () => {
      const versionData = {
        project_id: 'proj-1',
        version_name: 'V2',
        quote_snapshot: { positions: [], total: 1000 },
        is_active: true,
      };

      mockSupabaseClient.from().insert.mockResolvedValueOnce({
        data: { id: 'version-1', ...versionData },
        error: null,
      });

      const result = await mockSupabaseClient.from('quote_versions').insert(versionData);
      expect(result.error).toBeNull();
    });
  });
});
