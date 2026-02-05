# P0 Evidence Pack — Deployment Truth (Vercel + Supabase)

## Cel
Ten dokument służy do zamknięcia statusu **PASS/FAIL** dla produkcyjnego wdrożenia.
Brak pełnych dowodów = status **FAIL** albo **UNRESOLVED**.

---

## VERCEL

### CO WKLEIĆ
1. Screenshot z **Vercel → Project Settings → Git** z widocznym repo i Production Branch.
2. Screenshot z **Vercel → Deployments** z ostatnim produkcyjnym deploymentem (czas + commit SHA).
3. URL produkcyjny + screenshot działającej strony (nagłówek + stopka).
4. Fragment logu buildu pokazujący komendę build i wynik sukcesu.
5. Screenshot z **Environment Variables** (Production + Preview) dla:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

**PASS/FAIL:** `UNRESOLVED`

**Blockers:**
- Brak screenshotu integracji Git (repo + branch).
- Brak publicznego dowodu, że deploy produkcyjny bierze właściwy commit.

---

## SUPABASE

### CO WKLEIĆ
1. Screenshot z **Supabase → Settings → General** z `project_id`.
2. Wynik `supabase migration list` (lub ekran SQL/CLI) potwierdzający applied migrations.
3. Porównanie: liczba migracji w repo vs applied na produkcji.
4. Screenshot z **Edge Functions** z listą wdrożonych funkcji.
5. Screenshot z **Edge Functions → Secrets** (same nazwy sekretów, bez wartości).
6. Log 1–2 ostatnich wywołań funkcji bez błędów krytycznych.

**PASS/FAIL:** `UNRESOLVED`

**Blockers:**
- Brak dowodu, że migracje z repo są zastosowane na produkcji.
- Brak dowodu, że funkcje z repo są wdrożone 1:1.

---

## Minimum Evidence (wymagane, 8/8)
- [ ] Vercel Git integration: repo + production branch.
- [ ] Vercel Deployments: ostatni produkcyjny deploy + SHA.
- [ ] Vercel Build log: sukces + brak błędu krytycznego.
- [ ] Vercel env vars: `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` (Production + Preview).
- [ ] Supabase project_id z panelu zgodny z `supabase/config.toml`.
- [ ] Supabase migration status: applied migrations na produkcji.
- [ ] Supabase functions inventory: lista wdrożonych funkcji.
- [ ] Supabase functions logs: brak krytycznych błędów na aktualnym deployu.

## Nice-to-have Evidence
- [ ] Preview URL dla PR i potwierdzenie, że różni się od production URL.
- [ ] Porównanie czasu deployu i czasu commita (spójność pipeline).
- [ ] SQL snapshot kluczowych tabel/indeksów po deployu.
- [ ] Potwierdzenie RLS policy testem „admin vs non-admin”.

---

## Co zrobić jeśli FAIL
Minimalny plan na następny PR (bez wdrażania tutaj):
1. Dodać automatyczny workflow „deployment-proof” (read-only checks + artefakt logów).
2. Ujednolicić mapowanie branchy: `main` → production, PR → preview.
3. Dodać checklistę release ownera: Vercel Git check + Supabase migration check + functions check.
4. Wymusić blokadę merge bez załączonego evidence pack (template PR + required checks).
