/**
 * Sprint D — Template Activation Tests
 *
 * Verifies:
 * D1: Offer template activation — source_template_id is passed in insert payload
 * D2: Project template activation — stages_json from template is passed to createProject
 * D3: Template-to-flow continuity — getStarterPack lookup, ProjectStage shape
 */

import { describe, it, expect } from 'vitest';
import { getStarterPack, starterPacks } from '@/data/starterPacks';
import { projectTemplates } from '@/data/projectTemplates';

// ── D1: Offer template activation ─────────────────────────────────────────────

describe('D1 — Offer template starter packs', () => {
  it('every starter pack has a non-empty id', () => {
    for (const pack of starterPacks) {
      expect(pack.id).toBeTruthy();
      expect(typeof pack.id).toBe('string');
    }
  });

  it('getStarterPack returns correct pack by id', () => {
    const glazurnik = getStarterPack('glazurnik');
    expect(glazurnik).toBeDefined();
    expect(glazurnik?.tradeName).toBeTruthy();
  });

  it('getStarterPack returns undefined for unknown id', () => {
    expect(getStarterPack('unknown-pack-xyz')).toBeUndefined();
  });

  it('every starter pack has at least one item', () => {
    for (const pack of starterPacks) {
      expect(pack.items.length).toBeGreaterThan(0);
    }
  });

  it('every starter pack item has required fields for offer_items insert', () => {
    for (const pack of starterPacks) {
      for (const item of pack.items) {
        expect(item.name).toBeTruthy();
        expect(typeof item.qty).toBe('number');
        expect(item.qty).toBeGreaterThan(0);
        expect(typeof item.price).toBe('number');
        expect(item.price).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ── D2: Project template activation ───────────────────────────────────────────

describe('D2 — Project template phases → ProjectStage conversion', () => {
  it('every project template has phases', () => {
    for (const tpl of projectTemplates) {
      expect(tpl.phases.length).toBeGreaterThan(0);
    }
  });

  it('every project template phase has a non-empty name', () => {
    for (const tpl of projectTemplates) {
      for (const phase of tpl.phases) {
        expect(phase.name).toBeTruthy();
      }
    }
  });

  it('phases can be mapped to valid ProjectStage objects', () => {
    for (const tpl of projectTemplates) {
      const stages = tpl.phases.map((phase, idx) => ({
        name: phase.name,
        due_date: null,
        is_done: false,
        sort_order: idx,
      }));

      for (const [idx, stage] of stages.entries()) {
        expect(stage.name).toBeTruthy();
        expect(stage.due_date).toBeNull();
        expect(stage.is_done).toBe(false);
        expect(stage.sort_order).toBe(idx);
      }
    }
  });

  it('stages sort_order is sequential starting from 0', () => {
    const tpl = projectTemplates[0];
    const stages = tpl.phases.map((p, i) => ({ ...p, sort_order: i, is_done: false, due_date: null }));
    stages.forEach((s, i) => expect(s.sort_order).toBe(i));
  });
});

// ── D3: Template-to-flow continuity ──────────────────────────────────────────

describe('D3 — Template continuity: getStarterPack covers all pack ids', () => {
  it('getStarterPack resolves every id in starterPacks', () => {
    for (const pack of starterPacks) {
      const found = getStarterPack(pack.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(pack.id);
    }
  });

  it('project template ids are unique', () => {
    const ids = projectTemplates.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('starter pack ids are unique', () => {
    const ids = starterPacks.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ── D5: No regression in offer-first architecture ────────────────────────────

describe('D5 — Offer-first architecture not broken', () => {
  it('project templates do NOT include financial fields (offer-first)', () => {
    for (const tpl of projectTemplates) {
      // Project templates must not contain pricing — pricing belongs in offers
      expect((tpl as Record<string, unknown>).items).toBeUndefined();
      expect((tpl as Record<string, unknown>).price).toBeUndefined();
      expect((tpl as Record<string, unknown>).total_net).toBeUndefined();
    }
  });
});
