# AGENTS.md

Zakres: całe repozytorium.

## Zasady procesu (obowiązkowe)
1. **Zakaz push bezpośrednio na `main`.** Praca tylko na branchu roboczym.
2. **Merge tylko przez PR** po review.
3. **Merge dopiero po green checks** (minimum: lint, test, build, type-check).
4. **1 PR = 1 cel.** Bez scope creep.
5. Każdy PR musi mieć: Scope Fence, DoD, testy, rollback, ryzyka.

## Zasady bezpieczeństwa zmian
- Nie modyfikuj migracji historycznych.
- Nie wdrażaj runtime/config „przy okazji” PR-a docs-only.
- W przypadku konfliktu priorytet ma `docs/ROADMAP_ENTERPRISE.md` (source of truth).

## Zasady wydajnościowe (obowiązkowe od PR4)

Pełna dokumentacja: [`docs/PERFORMANCE_GUARDRAILS.md`](docs/PERFORMANCE_GUARDRAILS.md)

### Przed otwarciem każdego PR dotyczącego src/ lub vite.config.ts:
1. Uruchom `npm run check:perf` — przejrzyj wyniki.
2. Nie dodawaj ciężkich bibliotek (jspdf, recharts, exceljs, leaflet, html2canvas) jako statycznych importów w ścieżce startowej (`App.tsx`, `AppLayout.tsx`, `main.tsx`). Użyj `React.lazy()`.
3. Nie pisz `select('*')` w nowych hookach ani zapytaniach — wymieniaj tylko potrzebne kolumny.
4. Nie ustawiaj `staleTime: 0` bez udokumentowanego powodu w PR i w `PERFORMANCE_GUARDRAILS.md §5`.
5. Nie dodawaj animacji dłuższych niż 200 ms.
6. Każdy PR dotykający krytycznych przepływów (oferta, PDF, zatwierdź, wyślij) wymaga ręcznego smoke-testu (patrz §10 w guardrails).
7. PR wrażliwy na wydajność wymaga dowodów (rozmiar bundy przed/po) i linku do Vercel preview (patrz §11 w guardrails).

