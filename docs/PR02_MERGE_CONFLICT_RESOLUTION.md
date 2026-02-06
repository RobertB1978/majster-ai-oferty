# PR#02 — notatka dot. konfliktów merge

## Stan gałęzi
- W lokalnym repo dostępna jest gałąź robocza `work`.
- W tym środowisku nie ma skonfigurowanego zdalnego `origin`, więc nie było technicznej możliwości wykonać `fetch`/`push`.

## Jak rozwiązano konflikt semantyczny (main-first)
Przyjęto zasadę „main jako baza” na poziomie treści:
1. Zachowano istniejące treści `docs/DEPLOYMENT_TRUTH.md` i dopilnowano, że dokument nadal ma status `UNRESOLVED` oraz linki do evidence pack/request.
2. Utrzymano pliki PR#02 bez utraty zawartości:
   - `docs/P0_EVIDENCE_PACK.md`
   - `docs/ADR/ADR-0001-current-stack-fact.md`
   - `scripts/verify/*`
3. Ograniczono hałas wyjścia `scripts/verify/vercel_repo_checks.sh`, żeby wynik był czytelny podczas review i CI.

## Scope fence
Zmiany wyłącznie w:
- `docs/**`
- `scripts/verify/**`
