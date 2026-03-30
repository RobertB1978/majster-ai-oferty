/**
 * Media Library Foundation Types (PR-1)
 *
 * Central type definitions for the global photo/media library.
 * These types mirror the database schema defined in:
 *   supabase/migrations/20260330120000_media_library_foundation.sql
 *
 * TODO PR-2: Add backfill types for legacy project-photos/ prefix normalization.
 */

// ---------------------------------------------------------------------------
// Media Library – central asset table
// ---------------------------------------------------------------------------

export interface MediaAsset {
  readonly id: string;
  user_id: string;
  /** Path inside project-photos bucket. No bucket prefix.
   *  e.g. "user-id/media/uuid.jpg" */
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  caption: string | null;
  tags: string[];
  ai_analysis: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface MediaAssetInsert {
  user_id: string;
  storage_path: string;
  file_name: string;
  file_size?: number | null;
  mime_type?: string | null;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  tags?: string[];
  ai_analysis?: Record<string, unknown> | null;
}

export interface MediaAssetUpdate {
  caption?: string | null;
  tags?: string[];
  ai_analysis?: Record<string, unknown> | null;
  file_name?: string;
}

// ---------------------------------------------------------------------------
// Link tables
// ---------------------------------------------------------------------------

export interface PhotoProjectLink {
  readonly id: string;
  photo_id: string;
  project_id: string;
  user_id: string;
  phase: string | null;
  sort_order: number;
  created_at: string;
}

export interface PhotoProjectLinkInsert {
  photo_id: string;
  project_id: string;
  user_id: string;
  phase?: string | null;
  sort_order?: number;
}

export interface PhotoOfferLink {
  readonly id: string;
  photo_id: string;
  offer_id: string;
  user_id: string;
  sort_order: number;
  created_at: string;
}

export interface PhotoOfferLinkInsert {
  photo_id: string;
  offer_id: string;
  user_id: string;
  sort_order?: number;
}

export interface PhotoClientLink {
  readonly id: string;
  photo_id: string;
  client_id: string;
  user_id: string;
  sort_order: number;
  created_at: string;
}

export interface PhotoClientLinkInsert {
  photo_id: string;
  client_id: string;
  user_id: string;
  sort_order?: number;
}

// ---------------------------------------------------------------------------
// Canonical storage path helpers (type-level)
// ---------------------------------------------------------------------------

/**
 * Canonical storage path format for new media uploads.
 * Pattern: {userId}/media/{fileId}.{ext}
 *
 * Legacy paths (e.g. with project-photos/ prefix or {userId}/{projectId}/ pattern)
 * are NOT normalized in PR-1 runtime code.
 * TODO PR-2: handle legacy path normalization in backfill.
 */
export type MediaStoragePathSegment = 'media';

/**
 * Supported link entity types for the media library.
 */
export type MediaLinkEntity = 'project' | 'offer' | 'client';
