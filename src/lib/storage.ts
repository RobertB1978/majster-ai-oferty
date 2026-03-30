/**
 * Canonical storage path helpers for the media library.
 *
 * media_library.storage_path is always stored WITHOUT bucket prefix.
 * Legacy values like "project-photos/userId/projectId/file.jpg"
 * must be normalized to "userId/projectId/file.jpg".
 */

/** The single Supabase Storage bucket used for all project media. */
export const MEDIA_BUCKET = 'project-photos';

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

  // Strip bucket prefix
  const prefix = 'project-photos/';
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
