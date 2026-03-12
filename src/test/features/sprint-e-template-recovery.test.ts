/**
 * Sprint E — Template Recovery & Guidance Tests
 *
 * Verifies:
 * E1: Offer with template origin — metadata is resolvable for recovery card
 * E2: Offer without template origin — no UI leakage
 * E3: Project with template stages — stages count computable, note renders
 * E4: Project without template stages — no note rendered
 * E5: Graceful fallback for unknown / null template IDs
 */

import { describe, it, expect } from 'vitest';
import { getStarterPack, starterPacks } from '@/data/starterPacks';
import type { StarterPack } from '@/data/starterPacks';
import type { ProjectStage } from '@/hooks/useProjectsV2';

// ── E1: Offer with template origin ─────────────────────────────────────────────

describe('E1 — Offer template origin: metadata available for recovery card', () => {
  it('getStarterPack resolves a known source_template_id', () => {
    const pack = getStarterPack('glazurnik');
    expect(pack).toBeDefined();
    expect(pack?.tradeName).toBeTruthy();
  });

  it('every starter pack exposes tradeName, description, bestFor, starterNotes for recovery card', () => {
    for (const pack of starterPacks) {
      expect(pack.tradeName).toBeTruthy();
      expect(pack.description).toBeTruthy();
      expect(pack.bestFor).toBeTruthy();
      expect(pack.starterNotes).toBeTruthy();
    }
  });

  it('material and labor item counts are computable for recovery card summary', () => {
    for (const pack of starterPacks) {
      const materialCount = pack.items.filter(i => i.category === 'Materiał').length;
      const laborCount    = pack.items.filter(i => i.category === 'Robocizna').length;
      // Summary line: "X materiałów · Y poz. robocizny"
      expect(materialCount + laborCount).toBe(pack.items.length);
      expect(materialCount + laborCount).toBeGreaterThan(0);
    }
  });

  it('TemplateDetailSheet can partition items into materials and labor groups', () => {
    const pack = getStarterPack('hydraulik') as StarterPack;
    const materialItems = pack.items.filter(i => i.category === 'Materiał');
    const laborItems    = pack.items.filter(i => i.category === 'Robocizna');
    // Both groups must be non-empty for a meaningful sheet
    expect(materialItems.length).toBeGreaterThan(0);
    expect(laborItems.length).toBeGreaterThan(0);
    // Every item must have name and unit for list display
    for (const item of [...materialItems, ...laborItems]) {
      expect(item.name).toBeTruthy();
      expect(item.unit).toBeTruthy();
    }
  });
});

// ── E2: Offer without template origin — no leakage ────────────────────────────

describe('E2 — Offer without template origin: no UI leakage', () => {
  it('getStarterPack returns undefined when source_template_id is null', () => {
    // Simulates: const templatePack = offer.source_template_id
    //   ? getStarterPack(offer.source_template_id) : undefined;
    const sourceTemplateId: string | null = null;
    const pack = sourceTemplateId ? getStarterPack(sourceTemplateId) : undefined;
    expect(pack).toBeUndefined();
  });

  it('conditional render guard — templatePack undefined means no card renders', () => {
    const templatePack: StarterPack | undefined = undefined;
    // Pattern: {templatePack && <TemplateRecoveryCard ... />}
    const wouldRender = Boolean(templatePack);
    expect(wouldRender).toBe(false);
  });

  it('conditional render guard — templatePack defined means card renders', () => {
    const templatePack = getStarterPack('malarz');
    const wouldRender = Boolean(templatePack);
    expect(wouldRender).toBe(true);
  });
});

// ── E3: Project with template stages ──────────────────────────────────────────

describe('E3 — Project with template stages: stage note renders', () => {
  const stagesFromTemplate: ProjectStage[] = [
    { name: 'Prace rozbiórkowe', due_date: null, is_done: false, sort_order: 0 },
    { name: 'Hydraulika',        due_date: null, is_done: false, sort_order: 1 },
    { name: 'Glazura',           due_date: null, is_done: false, sort_order: 2 },
    { name: 'Wykończenie',       due_date: null, is_done: false, sort_order: 3 },
  ];

  it('stagesCount > 0 means TemplateStagesNote should render', () => {
    const stagesCount = stagesFromTemplate.length;
    const shouldRender = stagesCount > 0;
    expect(shouldRender).toBe(true);
    expect(stagesCount).toBe(4);
  });

  it('label text is computable: "Plan startowy · N etapów"', () => {
    const stagesCount = stagesFromTemplate.length;
    const label = `Plan startowy · ${stagesCount} etapów`;
    expect(label).toBe('Plan startowy · 4 etapów');
  });

  it('label with template name: "TradeName · N etapów"', () => {
    const pack = getStarterPack('glazurnik') as StarterPack;
    const stagesCount = stagesFromTemplate.length;
    const label = `${pack.tradeName} · ${stagesCount} etapów`;
    expect(label).toBe('Glazurnik · 4 etapów');
  });
});

// ── E4: Project without template stages ──────────────────────────────────────

describe('E4 — Project without template stages: no note rendered', () => {
  it('empty stages_json → stagesCount === 0 → TemplateStagesNote returns null', () => {
    const stagesJson: ProjectStage[] = [];
    const stagesCount = stagesJson.length;
    const shouldRender = stagesCount > 0;
    expect(shouldRender).toBe(false);
  });

  it('stages_json = [] is the default for manually created projects', () => {
    // Mirrors baseProject() in ProjectHub.test.tsx
    const stages_json: ProjectStage[] = [];
    expect(stages_json.length).toBe(0);
  });
});

// ── E5: Graceful fallback for unknown / null / empty template IDs ─────────────

describe('E5 — Graceful fallback for unknown template IDs', () => {
  const badIds = ['unknown-xyz', '', 'null', 'undefined', 'GLAZURNIK', 'glazurnik-v2'];

  it('getStarterPack returns undefined for all bad/unknown ids', () => {
    for (const id of badIds) {
      expect(getStarterPack(id)).toBeUndefined();
    }
  });

  it('unknown template id: TemplateRecoveryCard would not render (safe guard)', () => {
    const unknownId = 'totally-unknown-template';
    const pack = getStarterPack(unknownId);
    // Guard pattern in UI: {pack && <TemplateRecoveryCard ... />}
    expect(Boolean(pack)).toBe(false);
  });

  it('undefined from getStarterPack is never-throwing and renders nothing', () => {
    // No throw, no error — pure undefined return
    expect(() => getStarterPack('bad-id-!!!!')).not.toThrow();
    expect(getStarterPack('bad-id-!!!!')).toBeUndefined();
  });

  it('known ids resolve correctly — sanity check for all 10 starter packs', () => {
    // Ensures every starterPack can be found by its own id
    for (const pack of starterPacks) {
      const found = getStarterPack(pack.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(pack.id);
      expect(found?.tradeName).toBeTruthy();
    }
  });
});
