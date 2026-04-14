/**
 * storage-constants — PR-BE-LOW-01
 *
 * Verifies that:
 * 1. All bucket name constants are defined and non-empty strings.
 * 2. normalizeStoragePath strips the MEDIA_BUCKET prefix deterministically.
 * 3. TEAM_MEMBERS_TABLE constant resolves to the expected value.
 *
 * This test acts as a regression guard: if someone accidentally changes a
 * bucket name or removes a constant, this test will catch it before production.
 */

import { describe, it, expect } from 'vitest';
import {
  MEDIA_BUCKET,
  DOSSIER_BUCKET,
  COMPANY_DOCUMENTS_BUCKET,
  TEAM_MEMBERS_TABLE,
  normalizeStoragePath,
} from '@/lib/storage';

describe('storage constants — central source of truth', () => {
  it('MEDIA_BUCKET resolves to the correct bucket name', () => {
    expect(MEDIA_BUCKET).toBe('project-photos');
  });

  it('DOSSIER_BUCKET resolves to the correct bucket name', () => {
    expect(DOSSIER_BUCKET).toBe('dossier');
  });

  it('COMPANY_DOCUMENTS_BUCKET resolves to the correct bucket name', () => {
    expect(COMPANY_DOCUMENTS_BUCKET).toBe('company-documents');
  });

  it('TEAM_MEMBERS_TABLE resolves to the correct table name', () => {
    expect(TEAM_MEMBERS_TABLE).toBe('team_members');
  });

  it('all bucket constants are non-empty strings', () => {
    [MEDIA_BUCKET, DOSSIER_BUCKET, COMPANY_DOCUMENTS_BUCKET].forEach((name) => {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });
  });
});

describe('normalizeStoragePath — uses MEDIA_BUCKET constant', () => {
  it('strips MEDIA_BUCKET prefix from path', () => {
    expect(normalizeStoragePath('project-photos/uid/pid/img.jpg')).toBe('uid/pid/img.jpg');
  });

  it('leaves path unchanged when bucket prefix is absent', () => {
    expect(normalizeStoragePath('uid/pid/img.jpg')).toBe('uid/pid/img.jpg');
  });

  it('strips query parameters from path', () => {
    expect(normalizeStoragePath('uid/pid/img.jpg?token=abc')).toBe('uid/pid/img.jpg');
  });

  it('strips both bucket prefix and query parameters', () => {
    expect(normalizeStoragePath('project-photos/uid/pid/img.jpg?token=xyz')).toBe(
      'uid/pid/img.jpg',
    );
  });

  it('handles path that matches MEDIA_BUCKET constant (regression: no hardcoded string)', () => {
    // If MEDIA_BUCKET changes, this test still passes because normalizeStoragePath uses the constant
    const path = `${MEDIA_BUCKET}/some/file.jpg`;
    expect(normalizeStoragePath(path)).toBe('some/file.jpg');
  });
});
