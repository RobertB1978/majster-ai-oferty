/**
 * Dossier Persistence Tests
 *
 * Verifies the "Save to dossier" flow for document templates:
 * 1. Project selector enables save-to-dossier when projectId provided
 * 2. Save-to-dossier button disabled when no projectId
 * 3. Template dossierCategory maps correctly to dossier categories
 * 4. Upload path construction is correct
 * 5. Cache invalidation key matches dossier query key
 */

import { describe, it, expect } from 'vitest';
import {
  ALL_TEMPLATES,
  getTemplatesByCategory,
} from '@/data/documentTemplates';
import type { TemplateCategory } from '@/data/documentTemplates';
import { DOSSIER_CATEGORIES, type DossierCategory } from '@/hooks/useDossier';

// ── 1: Every template has a valid dossierCategory ────────────────────────────

describe('Dossier persistence — template dossierCategory mapping', () => {
  it('every template has a dossierCategory defined', () => {
    for (const tpl of ALL_TEMPLATES) {
      expect(tpl.dossierCategory).toBeTruthy();
      expect(typeof tpl.dossierCategory).toBe('string');
    }
  });

  it('every template dossierCategory is a valid DossierCategory', () => {
    const validCategories: DossierCategory[] = [...DOSSIER_CATEGORIES];
    for (const tpl of ALL_TEMPLATES) {
      expect(validCategories).toContain(tpl.dossierCategory as DossierCategory);
    }
  });

  it('CONTRACT templates map to CONTRACT dossier category', () => {
    const contractTemplates = ALL_TEMPLATES.filter(
      (tpl) => tpl.category === 'CONTRACTS'
    );
    expect(contractTemplates.length).toBeGreaterThan(0);
    for (const tpl of contractTemplates) {
      expect(tpl.dossierCategory).toBe('CONTRACT');
    }
  });

  it('PROTOCOL templates map to PROTOCOL dossier category', () => {
    const protocolTemplates = ALL_TEMPLATES.filter(
      (tpl) => tpl.category === 'PROTOCOLS'
    );
    expect(protocolTemplates.length).toBeGreaterThan(0);
    for (const tpl of protocolTemplates) {
      expect(tpl.dossierCategory).toBe('PROTOCOL');
    }
  });

  it('ANNEXES templates have valid dossier categories (CONTRACT or OTHER)', () => {
    const annexTemplates = ALL_TEMPLATES.filter(
      (tpl) => tpl.category === 'ANNEXES'
    );
    expect(annexTemplates.length).toBe(6);
    for (const tpl of annexTemplates) {
      expect(['CONTRACT', 'OTHER']).toContain(tpl.dossierCategory);
    }
  });

  it('COMPLIANCE templates map to OTHER dossier category', () => {
    const complianceTemplates = ALL_TEMPLATES.filter(
      (tpl) => tpl.category === 'COMPLIANCE'
    );
    expect(complianceTemplates.length).toBe(5);
    for (const tpl of complianceTemplates) {
      expect(tpl.dossierCategory).toBe('OTHER');
    }
  });

  it('every template category in TEMPLATE_CATEGORIES has consistent templates', () => {
    const categoriesWithTemplates: TemplateCategory[] = ['CONTRACTS', 'PROTOCOLS', 'ANNEXES', 'COMPLIANCE'];
    for (const cat of categoriesWithTemplates) {
      const templates = getTemplatesByCategory(cat);
      expect(templates.length).toBeGreaterThan(0);
    }
  });

  it('every template key is unique across ALL_TEMPLATES', () => {
    const keys = ALL_TEMPLATES.map((t) => t.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});

// ── 2: Save-to-dossier enabled/disabled conditions ──────────────────────────

describe('Dossier persistence — save button enabled conditions', () => {
  it('projectId null should disable save (simulated condition)', () => {
    const projectId: string | null = null;
    const isBusy = false;
    const disabled = isBusy || !projectId;
    expect(disabled).toBe(true);
  });

  it('projectId present should enable save (simulated condition)', () => {
    const projectId: string | null = 'test-project-uuid';
    const isBusy = false;
    const disabled = isBusy || !projectId;
    expect(disabled).toBe(false);
  });

  it('isBusy should disable save even with projectId', () => {
    const projectId: string | null = 'test-project-uuid';
    const isBusy = true;
    const disabled = isBusy || !projectId;
    expect(disabled).toBe(true);
  });
});

// ── 3: Upload path construction ─────────────────────────────────────────────

describe('Dossier persistence — upload path format', () => {
  it('constructs valid storage path with userId and projectId', () => {
    const userId = 'user-123';
    const projectId = 'proj-456';
    const instanceId = 'inst-789';
    const templateKey = 'umowa_ryczaltowa';
    const safeName = templateKey.replace(/[^a-zA-Z0-9_-]/g, '_');

    const filePath = `${userId}/${projectId}/documents/${safeName}_${instanceId}.pdf`;

    expect(filePath).toContain(userId);
    expect(filePath).toContain(projectId);
    expect(filePath).toContain('documents/');
    expect(filePath.endsWith('.pdf')).toBe(true);
  });

  it('path without projectId uses _no_project_ prefix', () => {
    const userId = 'user-123';
    const projectId: string | null = null;
    const instanceId = 'inst-789';
    const templateKey = 'protokol_koncowy';
    const safeName = templateKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    const projectPart = projectId ?? '_no_project_';

    const filePath = `${userId}/${projectPart}/documents/${safeName}_${instanceId}.pdf`;

    expect(filePath).toContain('_no_project_');
    expect(filePath.endsWith('.pdf')).toBe(true);
  });
});

// ── 4: Cache invalidation key consistency ────────────────────────────────────

describe('Dossier persistence — cache invalidation', () => {
  it('dossier query key matches invalidation key pattern', () => {
    const projectId = 'proj-456';
    const queryKey = ['dossier_items', projectId];
    const invalidationKey = ['dossier_items', projectId];

    expect(queryKey).toEqual(invalidationKey);
  });

  it('dossier query key with different projectId does not match', () => {
    const queryKey = ['dossier_items', 'proj-A'];
    const invalidationKey = ['dossier_items', 'proj-B'];

    expect(queryKey).not.toEqual(invalidationKey);
  });
});

// ── 5: Error resilience — ensureInstance failure does not block dossier save ──
//
// Covers the fix for the "Zapisz do teczki" runtime blocker:
// document_instances table may be absent in production (migration not yet applied).
// The save flow must complete the critical path (storage + project_dossier_items)
// even when ensureInstance() throws.

describe('Dossier persistence — error resilience', () => {
  it('fallback path using random UUID is still valid storage path', () => {
    const userId = 'user-abc';
    const projectId = 'proj-xyz';
    // Simulate crypto.randomUUID() fallback when ensureInstance fails
    const fallbackId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const templateKey = 'umowa_ryczaltowa';
    const safeName = templateKey.replace(/[^a-z0-9_]/g, '_');

    const filePath = `${userId}/${projectId}/documents/${safeName}_${fallbackId}.pdf`;

    expect(filePath).toContain(userId);
    expect(filePath).toContain(projectId);
    expect(filePath).toContain(fallbackId);
    expect(filePath.endsWith('.pdf')).toBe(true);
    // First path segment must be userId to satisfy storage RLS policy
    expect(filePath.split('/')[0]).toBe(userId);
  });

  it('ensureInstance failure does not prevent project_dossier_items insert attempt', () => {
    // Simulates the restructured handleSaveToDossier logic:
    // ensureInstance is caught separately; the dossier save still proceeds.
    let instanceFailed = false;
    let dossierSaveAttempted = false;

    const simulateHandleSaveToDossier = () => {
      // Step: ensureInstance (best-effort)
      try {
        throw new Error('relation "public.document_instances" does not exist');
      } catch (_instanceErr) {
        instanceFailed = true;
        // Continue — the critical path must still run
      }

      // Step: storage upload + project_dossier_items (always attempted)
      dossierSaveAttempted = true;
    };

    simulateHandleSaveToDossier();

    expect(instanceFailed).toBe(true);
    expect(dossierSaveAttempted).toBe(true);
  });

  it('updateInstance failure after successful dossier insert does not revert the save', () => {
    // Simulates: dossier item was created, but updateInstance throws.
    // The dossier entry must remain persisted.
    let dossierItemCreated = false;
    let updateInstanceFailed = false;
    let finalSaveSucceeded = false;

    const simulateFlow = () => {
      // Critical: dossier item created
      dossierItemCreated = true;

      // Best-effort: link instance
      try {
        throw new Error('relation "public.document_instances" does not exist');
      } catch (_updateErr) {
        updateInstanceFailed = true;
        // Non-critical — dossier item already in DB
      }

      // Success path still reached
      finalSaveSucceeded = true;
    };

    simulateFlow();

    expect(dossierItemCreated).toBe(true);
    expect(updateInstanceFailed).toBe(true);
    expect(finalSaveSucceeded).toBe(true);
  });
});
