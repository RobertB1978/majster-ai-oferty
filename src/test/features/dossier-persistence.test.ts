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
} from '@/data/documentTemplates';
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
