-- ============================================================
-- Acceptance Bridge (PR-Ex2zp)
-- Cel: śledzenie v2_project_id tworzonego przy akceptacji oferty
--      przez approve-offer edge function (gwarancja idempotencji).
--
-- Kontekst:
--   offer_approvals.project_id → legacy public.projects (FK istniejący)
--   Po akceptacji edge function tworzy teraz wpis w v2_projects.
--   Kolumna v2_project_id przechowuje to ID, aby:
--     a) kolejne wywołania (idempotentne) nie tworzyły duplikatów,
--     b) funkcja recovery naprawiała braki po częściowych błędach.
--
-- Luka schematu (udokumentowana):
--   offer_approvals NIE ma FK do tabeli offers (PR-09).
--   Dlatego v2_projects.source_offer_id ustawiany jest na NULL
--   dla projektów stworzonych z tego przepływu.
--   source_offer_id jest nullable — schemat nie wymaga poprawki.
-- ============================================================

ALTER TABLE public.offer_approvals
  ADD COLUMN IF NOT EXISTS v2_project_id uuid NULL
    REFERENCES public.v2_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_offer_approvals_v2_project_id
  ON public.offer_approvals (v2_project_id)
  WHERE v2_project_id IS NOT NULL;

COMMENT ON COLUMN public.offer_approvals.v2_project_id IS
  'ID wpisu v2_projects utworzonego gdy ta oferta została zaakceptowana '
  'przez approve-offer edge function. NULL dopóki nie zaakceptowana lub '
  'gdy tworzenie v2_project nie powiodło się. PR-Ex2zp Acceptance Bridge.';
