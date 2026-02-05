# P0_EVIDENCE_REQUEST.md

Cel: lista dowodów, które Robert ma wkleić, żeby domknąć P0 „Deployment Truth” bez zgadywania.

## Jak wkleić dowód
Dla każdego punktu podaj:
1. Źródło (panel/log/URL)
2. Datę i godzinę
3. Środowisko (production/preview)
4. Commit SHA (jeśli dotyczy)

## Vercel — wymagane dowody
1. **Project name + repo integration**
   - Screen: `Settings -> General`.
   - Musi być widoczne: Project Name, podpięte repo GitHub, Production Branch.
2. **Production URL**
   - Wklej pełny URL produkcyjny.
3. **Deployments (ostatni deploy)**
   - Screen: status deployu, commit SHA, czas wykonania.
4. **Git Integration**
   - Screen: że integracja z Git działa (auto deploy push/PR).
5. **Environment Variables**
   - Screen: same nazwy zmiennych + przypisanie do Production/Preview (bez wartości).
6. **Preview deploy dowód**
   - Link do jednego działającego URL preview + SHA PR.

## Supabase — wymagane dowody
7. **Project ref**
   - Screen: `Project Settings` z widocznym ref projektu.
8. **Database tables**
   - Screen: `Table Editor` z potwierdzeniem kluczowych tabel, w tym `admin_*` (jeśli mają istnieć).
9. **Migrations history**
   - Screen: lista migracji i kolejność wykonania.
10. **Edge Functions**
    - Screen: lista wdrożonych funkcji + status.
11. **Auth redirect URLs**
    - Screen: `Auth -> URL Configuration` (redirect URLs).
12. **Workflow/log deployu**
    - Link lub screen z runa `.github/workflows/supabase-deploy.yml` (sukces/fail, SHA, timestamp).

## Kryterium zamknięcia P0
- Vercel: komplet punktów 1-6.
- Supabase: komplet punktów 7-12.
- Braki dowodów = wynik FAIL w `docs/DEPLOYMENT_TRUTH.md`.
