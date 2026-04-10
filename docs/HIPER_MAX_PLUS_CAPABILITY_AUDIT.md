# HIPER MAX PLUS — Audyt Możliwości Operacyjnych

**Data audytu:** 2026-04-10  
**Gałąź:** `claude/audit-hiper-max-plus-JPWJF`  
**Model:** claude-sonnet-4-6  
**Metodologia:** Inspekcja plików konfiguracyjnych + testy aktywne + weryfikacja odpowiedzi narzędzi

---

## A) Podsumowanie Wykonawcze

- Git (fetch/push/commit/branch) działa przez lokalny proxy — potwierdzone testem `git fetch`.
- GitHub MCP: narzędzia `mcp__github__*` są autoryzowane w `settings.json` i dostępne na poziomie sesji Claude Code Web — odczyt, tworzenie branch, commit, push, PR, update PR — AKTYWNE.
- Merge PR wymaga interakcji Roberta (w `settings.json` w sekcji `"ask"`).
- Vercel MCP: URL `https://mcp.vercel.com` jest osiągalny, ale zwraca `{"error":"invalid_token"}` — **nie jest zalogowany/uwierzytelniony**. Nie można używać.
- Supabase MCP (dev): skonfigurowany w `.mcp.json`, ale zmienne środowiskowe `SUPABASE_DEV_URL` i `SUPABASE_DEV_SERVICE_ROLE_KEY` **nie są ustawione** w środowisku — serwer MCP nie może się uruchomić.
- `.claude/settings.local.json` **nie istnieje** — brak lokalnych nadpisań.
- Hook `post-edit-check.sh` skonfigurowany poprawnie — weryfikuje YAML po każdym Edit/Write.
- Python 3.11 + moduł `yaml` dostępne — hook działa.
- CI/CD (GitHub Actions) nie można bezpośrednio odczytać bez działającego GitHub MCP lub gh CLI.
- Produkcja Supabase jest poza zasięgiem — celowo i poprawnie.

---

## B) Macierz Możliwości

| Obszar | Możliwość | Status | Dowód | Uwagi |
|---|---|---|---|---|
| **GitHub** | Odczyt repozytorium | **TAK** | `git fetch` zwrócił listę branchy z GitHub przez proxy `127.0.0.1:41451` | Proxy działa |
| **GitHub** | Edycja plików lokalnie | **TAK** | Narzędzia Edit/Write dostępne; Bash z `git add *` autoryzowany | — |
| **GitHub** | Uruchamianie komend | **TAK** | `settings.json` pozwala na: git, npm, npx tsc, pytest, skrypty verify | Tylko whitelista |
| **GitHub** | Tworzenie branch | **TAK** | `git checkout *` autoryzowany; `mcp__github__create_branch` w allow | Potwierdzone przez fetch |
| **GitHub** | Commit | **TAK** | `git commit *` i `git add *` w allow | Bez `--no-verify` |
| **GitHub** | Push | **TAK** | `git push -u origin *` i `git push origin *` w allow; proxy działa | `--force origin main/master` zablokowany |
| **GitHub** | Tworzenie PR | **TAK** | `mcp__github__create_pull_request` w allow | GitHub MCP aktywny w sesji |
| **GitHub** | Odczyt CI/checks | **CZĘŚCIOWY** | `mcp__github__list_pull_requests`, `mcp__github__get_commit` w allow; brak narzędzia do check runs | Nie ma `mcp__github__list_check_runs` w konfiguracji |
| **GitHub** | Update PR | **TAK** | `mcp__github__update_pull_request` w allow | — |
| **GitHub** | Merge PR | **ASK** | `mcp__github__merge_pull_request` w sekcji `"ask"` settings.json | Wymaga zgody Roberta per-merge |
| **Vercel** | Odczyt deploymentów | **NIE** | `https://mcp.vercel.com` zwraca `{"error":"invalid_token"}` | Brak OAuth |
| **Vercel** | Odczyt logów Vercel | **NIE** | Jak wyżej — MCP nieuwiergodniony | Wymaga OAuth przez UI Claude Code |
| **Vercel** | Lista projektów Vercel | **NIE** | Jak wyżej | — |
| **Supabase dev** | Odczyt zasobów dev/staging | **NIE** | Zmienne `SUPABASE_DEV_URL` i `SUPABASE_DEV_SERVICE_ROLE_KEY` nie istnieją w env | MCP nie może się uruchomić |
| **Supabase dev** | Mutacje na dev/staging | **NIE** | Jak wyżej | — |
| **Supabase prod** | Bezpośredni kontakt z produkcją | **NIE** | Celowo — brak konfiguracji, brak klucza, brak narzędzia | Właściwe zabezpieczenie |
| **Deployment** | Weryfikacja prawdy wdrożenia | **CZĘŚCIOWY** | Mogę czytać pliki `docs/DEPLOYMENT_TRUTH.md`; nie mogę odpytać Vercel API | Tylko lokalna dokumentacja |
| **Hooks** | Uruchamianie hooków | **TAK** | `post-edit-check.sh` skonfigurowany w `PostToolUse`; Python 3.11 + yaml dostępne | async: true — nie blokuje |
| **Hooks** | Walidacja YAML/workflow | **TAK** | Hook sprawdza `.github/workflows/*.yml` po każdej edycji | python3 -c "import yaml" — OK |
| **Diagnostyka** | Diagnoza: kod vs CI vs deploy vs runtime | **CZĘŚCIOWY** | Kod — TAK; CI — CZĘŚCIOWY (brak check runs); Deploy — NIE (Vercel MCP nieaktywny); Runtime — NIE | Pełna diagnoza niemożliwa |

---

## C) Co mogę zrobić TERAZ bez Roberta

1. Czytać, edytować i pisać wszystkie pliki w repozytorium
2. Uruchamiać `npm run lint`, `npm run build`, `npm test`, `npx tsc`
3. Tworzyć nowe gałęzie lokalnie i pushować je do GitHub
4. Commitować zmiany z opisowymi wiadomościami
5. Tworzyć Pull Requesty na GitHub (przez `mcp__github__create_pull_request`)
6. Aktualizować istniejące PR (przez `mcp__github__update_pull_request`)
7. Przeglądać listę PR, branchy, commitów, plików w repo (GitHub MCP)
8. Komentować na issue/PR (`mcp__github__add_issue_comment`)
9. Walidować YAML plików workflow (hook działa automatycznie)
10. Czytać i aktualizować dokumentację w `docs/`
11. Tworzyć nowe migracje Supabase (lokalnie, jako pliki SQL)
12. Uruchamiać skrypty z `scripts/verify/*.sh` i `scripts/verify/*.mjs`

---

## D) Czego NIE mogę zrobić (zablokowane lub niedostępne)

1. **Mergować PR** bez jawnej zgody Roberta (wymaga interakcji "ask")
2. **Odpytywać Vercel API** — brak tokena OAuth; nie wiem co jest wdrożone, jakie są logi, czy deploy się powiódł
3. **Czytać Vercel logi runtime** — pełna ślepota na środowisko produkcyjne po stronie deployu
4. **Odpytywać lub mutować Supabase dev/staging** — brak zmiennych środowiskowych
5. **Odpytywać lub mutować Supabase produkcję** — celowo zablokowane, brak konfiguracji
6. **Pushować force do main/master** — zablokowane w `deny`
7. **Uruchamiać `git reset`** bez zgody (sekcja `"ask"`)
8. **Odczytywać status CI/check runs** przez MCP — brak narzędzia `mcp__github__list_check_runs` w konfiguracji
9. **Diagnozy end-to-end** (kod → CI → deploy → runtime) — Vercel i Supabase dev niedostępne

---

## E) Co wymaga działania Roberta (max 10 pozycji)

1. **Zalogować Vercel MCP przez OAuth w Claude Code Web** — wejść w ustawienia MCP w interfejsie i przejść OAuth flow dla `https://mcp.vercel.com`
2. **Ustawić zmienną środowiskową `SUPABASE_DEV_URL`** — URL projektu dev/staging Supabase w konfiguracji sesji Claude Code Web (nie w kodzie)
3. **Ustawić zmienną środowiskową `SUPABASE_DEV_SERVICE_ROLE_KEY`** — service role key projektu dev/staging (jako secret sesji, NIE w `.env` repozytorium)
4. **Potwierdzić, że projekt dev/staging Supabase faktycznie istnieje** — jeśli nie istnieje, zdecydować czy tworzyć fork produkcji czy nowy projekt
5. **Dodać `mcp__github__list_check_runs` do allow** w `.claude/settings.json` (lub odpowiedni tool do czytania CI checks) — jeśli chce pełny odczyt statusu CI
6. **Zdecydować czy merge PR przez Claude jest kiedykolwiek dozwolony bez pytania** — jeśli tak, przenieść `mcp__github__merge_pull_request` z `"ask"` do `"allow"` z warunkiem (np. tylko na nie-main gałęzie)
7. **Zweryfikować że Vercel projekt jest połączony z gałęzią `main`** — żeby Claude mógł diagnozować czy deploy preview działa po stworzeniu PR

---

## F) Ostateczny Werdykt

### HIPER MAX PLUS CZĘŚCIOWO AKTYWNY

**Uzasadnienie:**

Fundament jest gotowy: pliki konfiguracyjne (`.mcp.json`, `.claude/settings.json`, hook) istnieją i są poprawnie napisane. Git działa przez proxy. GitHub MCP jest aktywny w sesji — Claude może czytać repo, tworzyć branch, commitować, pushować, tworzyć i aktualizować PR. To pokrywa ~60-70% wizji HIPER MAX PLUS.

Jednak dwa kluczowe filary są martwe:
- **Vercel MCP** — skonfigurowany w `.mcp.json`, URL osiągalny, ale OAuth **nie został ukończony**. Claude jest ślepy na stan deploymentu, logi runtime i weryfikację prawdy produkcji.
- **Supabase dev MCP** — skonfigurowany w `.mcp.json`, ale zmienne środowiskowe **nie są przekazane** do sesji. Claude nie może sprawdzić, debugować ani modyfikować bazy danych dev/staging.

Bez tych dwóch warstw Claude nie może diagnozować problemów end-to-end (kod → CI → deploy → runtime), co było centralnym celem HIPER MAX PLUS. Robert nadal musi samodzielnie sprawdzać Vercel i Supabase przy każdym wdrożeniu.

---

## G) Plan Następnych Kroków

### Krok 1 — Claude robi teraz
Commituje i pushuje ten raport do gałęzi `claude/audit-hiper-max-plus-JPWJF`. Żadne zmiany w kodzie produktowym nie są wymagane.

### Krok 2 — Robert robi (kolejność ważna)
1. Vercel OAuth: w interfejsie Claude Code Web → Settings → MCP → Vercel → Connect/Authenticate
2. Supabase dev: w interfejsie Claude Code Web → Settings → Environment Variables → dodać `SUPABASE_DEV_URL` i `SUPABASE_DEV_SERVICE_ROLE_KEY` (wartości z Supabase Dashboard projektu dev/staging)

### Krok 3 — Co staje się możliwe po tym
- Claude może odpytać Vercel: sprawdzić status ostatniego deployu, pobrać logi buildu, zweryfikować czy PR preview deploy się powiódł
- Claude może odpytać Supabase dev: sprawdzić schemat, uruchomić query diagnostyczną, porównać migracje z kodem
- Pełna pętla: kod → commit → push → PR → CI → deploy → runtime — Claude diagnozuje każdy etap bez angażowania Roberta
- Robert reviewuje tylko PR i merguje — wszystko inne Claude obsługuje autonomicznie

---

*Raport wygenerowany: 2026-04-10 | Audyt read-only — żadne zmiany w kodzie produktowym nie zostały wprowadzone*
