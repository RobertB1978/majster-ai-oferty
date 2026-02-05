# P0 Evidence Request (dla Roberta)

## Cel
Dostarcz minimalny komplet dowodów, żeby zamknąć status P0 Deployment Truth jako PASS/FAIL.

## Evidence needed from Robert
- [ ] Vercel: screenshot `Settings → Git` (repo + Production Branch).
- [ ] Vercel: screenshot `Deployments` (ostatni production deploy z SHA i czasem).
- [ ] Vercel: fragment logu builda zakończony sukcesem.
- [ ] Vercel: screenshot env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) dla Production i Preview.
- [ ] Supabase: screenshot `Settings → General` z `project_id`.
- [ ] Supabase: wynik applied migrations z CLI/panelu.
- [ ] Supabase: screenshot listy Edge Functions wdrożonych na produkcji.
- [ ] Supabase: screenshot logs funkcji (ostatnie wywołania bez krytycznych błędów).

## Format dostarczenia
Wklej dowody do `docs/P0_EVIDENCE_PACK.md` i przy każdej sekcji ustaw:
- `PASS/FAIL`
- `Blockers` (jeśli brak pełnej zgodności)
