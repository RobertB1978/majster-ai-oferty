# P0_EVIDENCE_REQUEST.md

Cel: zebrać brakujące dowody do zamknięcia P0 „Deployment Truth”.

> Wklejamy tylko metadane i screeny. Bez sekretów, bez pełnych tokenów.

## 1) Co Robert ma dostarczyć — Vercel

1. **Project name** (screen z nagłówka projektu w Vercel).
2. **Production URL** (link do aktywnego środowiska produkcyjnego).
3. **Deployments screen**: ostatni produkcyjny deploy (status Success + data).
4. **Deployment details**: commit SHA użyty w deploymencie (ma się zgadzać z GitHub).
5. **Git integration screen**: podpięte repo + branch produkcyjny.
6. **Environment Variables screen**: nazwy zmiennych + zakresy (Production/Preview), bez wartości.
7. (Opcjonalnie) Screen z build logiem pokazującym Node/npm.

## 2) Co Robert ma dostarczyć — Supabase

1. **Project ref** (screen z ustawień projektu).
2. **Database → Tables**: potwierdzenie kluczowych tabel, w tym `admin_*`.
3. **Database → Migrations**: pełna lista migracji i kolejność.
4. **Edge Functions**: lista wdrożonych funkcji + daty ostatnich wdrożeń.
5. **Auth redirect URLs**: `Site URL` oraz `Redirect URLs`.
6. **Log GitHub Actions** z `.github/workflows/supabase-deploy.yml` (ostatnie uruchomienie, status).

## 3) Format dostarczenia (minimum)

Dla każdego punktu:
- Źródło (Vercel/Supabase/GitHub Actions)
- Data i strefa czasowa
- Środowisko (Production/Preview)
- Link lub screen
- Krótkie „PASS/FAIL”

## 4) Kryterium domknięcia P0

P0 można zamknąć dopiero, gdy:
- Vercel ma dowód integracji Git + ostatniego poprawnego deploya produkcyjnego.
- Supabase ma dowód zgodności migracji/funkcji między repo i dashboardem.
- Brak punktów „NIE WIEM”.
