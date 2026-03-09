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

## Zasady wydajności (PR4 — obowiązkowe)

Pełne zasady: `docs/PERFORMANCE_GUARDRAILS.md`.

Skrót dla agentów:

1. **Ścieżka startowa** — `recharts`, `jspdf`, `html2canvas`, `exceljs` są zakazane
   w `App.tsx` i `main.tsx`. Wymagają `React.lazy()`.

2. **Zapytania DB** — nowe read-hooki muszą używać jawnych kolumn, nie `select('*')`.
   Mutacje (insert/update/upsert) mogą używać `select('*')`.

3. **Animacje** — przejścia ≤ 200ms. Zakaz `AnimatePresence mode=”wait”` w routingu.

4. **Cache** — `staleTime: 0` tylko gdy dane muszą być zawsze świeże. Wymagany komentarz.

5. **Modalne zapytania** — dane otwierane w modalu przez `useQuery({ enabled: isOpen })`,
   nie przez `useEffect` + bezpośrednie wywołanie Supabase.

6. **Przed merge** — uruchom `npm run check:perf-guardrails` i wklej output w PR.

7. **Ryzykowne PRs** (App.tsx, AppLayout, zapytania na każdej stronie) — wymagają
   weryfikacji na Vercel preview, nie tylko lokalnie.

