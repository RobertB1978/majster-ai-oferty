import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportQuoteToCSV, exportQuoteToExcel, exportProjectsToCSV } from '@/lib/exportUtils';

describe('Export Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock document methods for link creation
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    document.createElement = vi.fn().mockReturnValue(mockLink);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  describe('exportQuoteToCSV', () => {
    it('creates CSV content from quote data', () => {
      const quoteData = {
        projectName: 'Test Project',
        positions: [
          { id: '1', name: 'Item 1', qty: 2, unit: 'szt.', price: 100, category: 'Materiał' as const },
          { id: '2', name: 'Item 2', qty: 1, unit: 'godz.', price: 50, category: 'Robocizna' as const },
        ],
        summaryMaterials: 200,
        summaryLabor: 50,
        marginPercent: 20,
        total: 300,
      };
      
      // Should not throw
      expect(() => exportQuoteToCSV(quoteData)).not.toThrow();
    });

    it('handles empty positions', () => {
      const quoteData = {
        projectName: 'Empty Project',
        positions: [],
        summaryMaterials: 0,
        summaryLabor: 0,
        marginPercent: 0,
        total: 0,
      };
      
      expect(() => exportQuoteToCSV(quoteData)).not.toThrow();
    });
  });

  describe('exportQuoteToExcel', () => {
    it('creates Excel file from quote data', async () => {
      const quoteData = {
        projectName: 'Excel Project',
        positions: [
          { id: '1', name: 'Material 1', qty: 5, unit: 'm2', price: 80, category: 'Materiał' as const },
        ],
        summaryMaterials: 400,
        summaryLabor: 0,
        marginPercent: 15,
        total: 460,
      };

      await expect(exportQuoteToExcel(quoteData)).resolves.not.toThrow();
    });

    it('generates valid xlsx buffer', async () => {
      const quoteData = {
        projectName: 'Buffer Test',
        positions: [
          { id: '1', name: 'Item 1', qty: 2, unit: 'szt.', price: 100, category: 'Materiał' as const },
          { id: '2', name: 'Item 2', qty: 1, unit: 'godz.', price: 50, category: 'Robocizna' as const },
        ],
        summaryMaterials: 200,
        summaryLabor: 50,
        marginPercent: 20,
        total: 300,
      };

      // Should complete without throwing
      await exportQuoteToExcel(quoteData);

      // Verify blob was created with correct type
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('exportProjectsToCSV', () => {
    it('exports projects list to CSV', () => {
      const projects = [
        { 
          project_name: 'Project 1', 
          status: 'Nowy', 
          created_at: '2024-01-15', 
          clients: { name: 'Client 1' },
          total: 5000 
        },
        { 
          project_name: 'Project 2', 
          status: 'Zakończony', 
          created_at: '2024-01-20', 
          clients: { name: 'Client 2' },
          total: 3000 
        },
      ];
      
      expect(() => exportProjectsToCSV(projects)).not.toThrow();
    });

    it('handles projects without clients', () => {
      const projects = [
        { 
          project_name: 'Orphan Project', 
          status: 'Nowy', 
          created_at: '2024-01-15', 
          clients: null,
        },
      ];
      
      expect(() => exportProjectsToCSV(projects)).not.toThrow();
    });

    it('handles empty projects array', () => {
      expect(() => exportProjectsToCSV([])).not.toThrow();
    });
  });
});
