/**
 * Canonical storage path helpers for the media library.
 *
 * media_library.storage_path is always stored WITHOUT bucket prefix.
 * Legacy values like "project-photos/userId/projectId/file.jpg"
 * must be normalized to "userId/projectId/file.jpg".
 *
 * ── Bucket name registry (single source of truth) ────────────────────────────
 * All Supabase Storage bucket names MUST be referenced via constants below.
 * Never hardcode bucket name strings outside this file.
 */

/** Storage bucket for all project media (photos, uploads). */
export const MEDIA_BUCKET = 'project-photos';

/** Storage bucket for project dossier files (PDFs, documents, signatures). */
export const DOSSIER_BUCKET = 'dossier';

/** Storage bucket for company-level documents (certifications, permits). */
export const COMPANY_DOCUMENTS_BUCKET = 'company-documents';

// ── Database table name constants ─────────────────────────────────────────────
// Minimal isolation point for tables referenced across multiple hooks.
// Prevents silent typos and makes future renames discoverable in one place.

/** Primary team members table. See: useTeamMembers.ts */
export const TEAM_MEMBERS_TABLE = 'team_members' as const;

/**
 * Normalize a storage path by stripping:
 * 1. The bucket prefix "project-photos/" if present
 * 2. Any query parameters (?token=… etc.)
 *
 * @example
 * normalizeStoragePath("project-photos/uid/pid/img.jpg") // "uid/pid/img.jpg"
 * normalizeStoragePath("uid/pid/img.jpg?token=x")        // "uid/pid/img.jpg"
 * normalizeStoragePath("uid/media/abc.webp")              // "uid/media/abc.webp"
 */
export function normalizeStoragePath(raw: string): string {
  let path = raw;

  // Strip bucket prefix using the central constant
  const prefix = `${MEDIA_BUCKET}/`;
  if (path.startsWith(prefix)) {
    path = path.slice(prefix.length);
  }

  // Strip query params
  const qIdx = path.indexOf('?');
  if (qIdx !== -1) {
    path = path.slice(0, qIdx);
  }

  return path;
}
