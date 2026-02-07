# P0 Evidence Pack — Vercel + Supabase (PASS/FAIL)

Cel: domknąć P0 „Deployment Truth" twardymi dowodami, bez zmian w produkcie.

## VERCEL

### Co wkleić
1. **Screenshot panelu Vercel → Project Settings → Git** z widocznym `Repository` i `Production Branch`.
2. **Screenshot panelu Vercel → Deployments** z ostatnim produkcyjnym deploymentem (`Ready`) + timestamp.
3. **URL produkcyjny** (np. domena custom) oraz **URL ostatniego Preview** dla PR.
4. **Fragment build logu** z ostatniego produkcyjnego deploymentu (linia z commit SHA + wynik build).
5. **Screenshot Environment Variables** (same nazwy + zakres Production/Preview, bez sekretów).

### Wynik
- **PASS/FAIL:** `UNRESOLVED`
- **Blockers:**
  - [ ] Brak potwierdzenia repo/brancha produkcyjnego.
  - [ ] Brak potwierdzenia auto-deploy z właściwego brancha.
  - [ ] Brak spójności env dla Production i Preview.

---

## SUPABASE

### Co wkleić
1. **Screenshot Supabase → Project Settings → General** z `Project ID`.
2. **Output z CLI lub panelu** pokazujący listę migracji zastosowanych na produkcji.
3. **Output porównania**: liczba migracji w repo vs liczba migracji na produkcji.
4. **Screenshot Supabase → Edge Functions** z listą funkcji wdrożonych.
5. **Log wywołania min. 1 funkcji krytycznej** (status code + timestamp).
6. **Screenshot Project Settings → Functions/Secrets** (same nazwy sekretów).

### Wynik
- **PASS/FAIL:** `UNRESOLVED`
- **Blockers:**
  - [ ] Brak dowodu, że migracje z repo są wdrożone na produkcję.
  - [ ] Brak dowodu, że Edge Functions z repo są wdrożone.
  - [ ] Brak dowodu, że wymagane sekrety istnieją na produkcji.

---

## Minimum Evidence (8 pozycji)
- [ ] Vercel Git integration: repo + production branch (screenshot).
- [ ] Vercel Deployments: ostatni produkcyjny deploy `Ready` (screenshot + timestamp).
- [ ] Vercel build log: commit SHA i wynik build.
- [ ] Vercel env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` dla Production i Preview.
- [ ] Supabase Project ID (screenshot).
- [ ] Supabase: lista migracji na produkcji + porównanie do repo.
- [ ] Supabase: lista wdrożonych Edge Functions.
- [ ] Supabase: dowód działania min. 1 funkcji (log/inspektor, status code).

## Nice-to-have Evidence
- [ ] Vercel: zrzut ustawień rewrites/headers.
- [ ] Vercel: screenshot domeny custom i certyfikatu SSL.
- [ ] Supabase: screenshot RLS policy dla tabel krytycznych.
- [ ] Supabase: screenshot metryk błędów Edge Functions (24h).
- [ ] Supabase: export listy sekretów jako check nazw (bez wartości).

---

## Co zrobić jeśli FAIL
Minimalny plan naprawczy (następny PR, bez wdrażania tutaj):
1. **Vercel FAIL**: doprecyzować mapowanie repo/branch, ustawić auto-deploy i ujednolicić env dla Production/Preview.
2. **Supabase FAIL (migracje)**: przygotować jednorazowy plan wyrównania driftu (repo ↔ prod), bez edycji historycznych migracji.
3. **Supabase FAIL (functions)**: wdrożyć brakujące funkcje i sekrety według listy krytycznej.
4. Dodać do CI krok `verify` publikujący artefakt z wynikiem PASS/FAIL.
5. Po fixie: zebrać ponownie pełny evidence pack i zaktualizować status w `docs/DEPLOYMENT_TRUTH.md`.
