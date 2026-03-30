-- ============================================================
-- PR-1: Media Library Foundation Schema
-- ============================================================
-- Central photo/media asset table + linking tables for
-- projects, offers, and clients.
--
-- TODO PR-2: legacy project-photos/ prefix normalization
--            must be handled in backfill migration.
-- ============================================================

-- ----------------------------------------------------------
-- 1. media_library – central source of truth for all assets
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_library (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,            -- path only, no bucket prefix (e.g. user-id/media/uuid.jpg)
  file_name     text NOT NULL,
  file_size     bigint,
  mime_type     text,
  width         integer,
  height        integer,
  caption       text,
  tags          text[] DEFAULT '{}',
  ai_analysis   jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.media_library IS 'Central media asset registry. storage_path is relative to project-photos bucket, no bucket prefix.';
COMMENT ON COLUMN public.media_library.storage_path IS 'Canonical path inside project-photos bucket. Format: {user_id}/media/{uuid}.{ext} for new uploads.';

-- ----------------------------------------------------------
-- 2. photo_project_links
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photo_project_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id    uuid NOT NULL REFERENCES public.media_library(id) ON DELETE CASCADE,
  project_id  uuid NOT NULL REFERENCES public.v2_projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase       text,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(photo_id, project_id)
);

COMMENT ON TABLE public.photo_project_links IS 'Links media assets to projects. Visibility lives on the link, not the asset.';

-- ----------------------------------------------------------
-- 3. photo_offer_links
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photo_offer_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id    uuid NOT NULL REFERENCES public.media_library(id) ON DELETE CASCADE,
  offer_id    uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(photo_id, offer_id)
);

COMMENT ON TABLE public.photo_offer_links IS 'Links media assets to offers.';

-- ----------------------------------------------------------
-- 4. photo_client_links
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photo_client_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id    uuid NOT NULL REFERENCES public.media_library(id) ON DELETE CASCADE,
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(photo_id, client_id)
);

COMMENT ON TABLE public.photo_client_links IS 'Links media assets to clients.';

-- ============================================================
-- 5. Row Level Security
-- ============================================================

-- media_library
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_library_select_own ON public.media_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY media_library_insert_own ON public.media_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY media_library_update_own ON public.media_library
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY media_library_delete_own ON public.media_library
  FOR DELETE USING (auth.uid() = user_id);

-- photo_project_links
ALTER TABLE public.photo_project_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY photo_project_links_select_own ON public.photo_project_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY photo_project_links_insert_own ON public.photo_project_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY photo_project_links_update_own ON public.photo_project_links
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY photo_project_links_delete_own ON public.photo_project_links
  FOR DELETE USING (auth.uid() = user_id);

-- photo_offer_links
ALTER TABLE public.photo_offer_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY photo_offer_links_select_own ON public.photo_offer_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY photo_offer_links_insert_own ON public.photo_offer_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY photo_offer_links_update_own ON public.photo_offer_links
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY photo_offer_links_delete_own ON public.photo_offer_links
  FOR DELETE USING (auth.uid() = user_id);

-- photo_client_links
ALTER TABLE public.photo_client_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY photo_client_links_select_own ON public.photo_client_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY photo_client_links_insert_own ON public.photo_client_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY photo_client_links_update_own ON public.photo_client_links
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY photo_client_links_delete_own ON public.photo_client_links
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 6. Indexes
-- ============================================================

-- media_library
CREATE INDEX idx_media_library_user_created
  ON public.media_library (user_id, created_at DESC);

-- photo_project_links
CREATE INDEX idx_photo_project_links_project
  ON public.photo_project_links (project_id);

CREATE INDEX idx_photo_project_links_project_phase
  ON public.photo_project_links (project_id, phase);

CREATE INDEX idx_photo_project_links_photo
  ON public.photo_project_links (photo_id);

CREATE INDEX idx_photo_project_links_user
  ON public.photo_project_links (user_id);

-- photo_offer_links
CREATE INDEX idx_photo_offer_links_offer
  ON public.photo_offer_links (offer_id);

CREATE INDEX idx_photo_offer_links_photo
  ON public.photo_offer_links (photo_id);

CREATE INDEX idx_photo_offer_links_user
  ON public.photo_offer_links (user_id);

-- photo_client_links
CREATE INDEX idx_photo_client_links_client
  ON public.photo_client_links (client_id);

CREATE INDEX idx_photo_client_links_photo
  ON public.photo_client_links (photo_id);

CREATE INDEX idx_photo_client_links_user
  ON public.photo_client_links (user_id);

-- ============================================================
-- 7. Storage policy for new uploads: {userId}/media/*
-- ============================================================
-- Allow authenticated users to upload into their own media folder
-- within the existing project-photos bucket.

CREATE POLICY media_library_storage_insert
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-photos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
    AND (string_to_array(name, '/'))[2] = 'media'
  );

CREATE POLICY media_library_storage_select
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-photos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
    AND (string_to_array(name, '/'))[2] = 'media'
  );

CREATE POLICY media_library_storage_delete
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-photos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
    AND (string_to_array(name, '/'))[2] = 'media'
  );
