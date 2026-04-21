-- PR-L4: Admin Legal CMS — RLS admin policies + publish RPC
-- Additive migration: new policies and functions only.
-- No table renames, no drops, no existing migration changes.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Helper: check if current authenticated user has admin role
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Admin RLS policies for legal_documents
--    Existing policy allows SELECT for published docs (public).
--    We add admin policies for full CRUD on all statuses.
-- ─────────────────────────────────────────────────────────────────────────────

-- Admin can read ALL documents regardless of status (draft, published, archived)
DROP POLICY IF EXISTS "legal_documents_admin_select" ON public.legal_documents;
CREATE POLICY "legal_documents_admin_select"
  ON public.legal_documents
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admin can insert new documents (drafts)
DROP POLICY IF EXISTS "legal_documents_admin_insert" ON public.legal_documents;
CREATE POLICY "legal_documents_admin_insert"
  ON public.legal_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admin can update documents
-- Note: trigger guard_legal_document_immutability still prevents
-- changing content/version of published documents — intentional.
-- Status transitions (draft→published, published→archived) are allowed.
DROP POLICY IF EXISTS "legal_documents_admin_update" ON public.legal_documents;
CREATE POLICY "legal_documents_admin_update"
  ON public.legal_documents
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Atomic publish RPC
--    Publishes a draft document:
--      1. Archives the currently published doc for same slug+language (if any)
--      2. Sets the draft to published with published_at = now()
--    Both steps run in a single transaction.
--    Only admins may call this function.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.publish_legal_document(p_draft_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft public.legal_documents%ROWTYPE;
  v_published_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'publish_legal_document: admin role required';
  END IF;

  SELECT * INTO v_draft
  FROM public.legal_documents
  WHERE id = p_draft_id AND status = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'publish_legal_document: document % not found or not in draft status', p_draft_id;
  END IF;

  -- Archive existing published version for same slug + language
  UPDATE public.legal_documents
  SET status = 'archived',
      updated_at = now()
  WHERE slug = v_draft.slug
    AND language = v_draft.language
    AND status = 'published';

  -- Promote draft to published
  UPDATE public.legal_documents
  SET status = 'published',
      published_at = now(),
      effective_at = COALESCE(v_draft.effective_at, now()),
      updated_at = now()
  WHERE id = p_draft_id
  RETURNING id INTO v_published_id;

  RETURN v_published_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_legal_document(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Helper: create a new draft from currently published document
--    Used by CMS "Create new draft" action.
--    Copies content from published, increments patch version, sets status=draft.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_legal_draft_from_published(
  p_slug text,
  p_language text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_published public.legal_documents%ROWTYPE;
  v_new_id uuid;
  v_parts text[];
  v_major int;
  v_minor int;
  v_new_version text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'create_legal_draft_from_published: admin role required';
  END IF;

  SELECT * INTO v_published
  FROM public.legal_documents
  WHERE slug = p_slug
    AND language = p_language
    AND status = 'published';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'create_legal_draft_from_published: no published doc for slug=% language=%', p_slug, p_language;
  END IF;

  -- Bump minor version: e.g. "1.0" -> "1.1"
  v_parts := string_to_array(v_published.version, '.');
  v_major := (v_parts[1])::int;
  v_minor := COALESCE((v_parts[2])::int, 0) + 1;
  v_new_version := v_major || '.' || v_minor;

  INSERT INTO public.legal_documents (
    slug, language, version, title, content, status, effective_at
  ) VALUES (
    v_published.slug,
    v_published.language,
    v_new_version,
    v_published.title,
    v_published.content,
    'draft',
    v_published.effective_at
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_legal_draft_from_published(text, text) TO authenticated;
