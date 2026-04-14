# Repo Hygiene Runbook — Majster.AI
<!-- docs/ops/REPO_HYGIENE_RUNBOOK.md -->
<!-- Wersja: 1.0.0 | Data: 2026-04-14 | Autor: Claude Code (PR-OPS-02) -->
<!-- SCOPE: Tylko docs/ops/** i scripts/ops/** — ŻADNYCH zmian w src/, supabase/, CI/CD -->

## Cel

Dokument definiuje bezpieczną procedurę sprzątania martwych branchy i starych PR-ów
w repozytorium `robertb1978/majster-ai-oferty`.

**Twoim zadaniem NIE jest teraz sprzątanie** — to jest plan i mapa ryzyka.
Robert wykonuje akcje destrukcyjne po przeczytaniu tego dokumentu i candidate matrix.

---

## Zasady Bezpieczeństwa (OBOWIĄZKOWE)

| # | Zasada | Uzasadnienie |
|---|--------|--------------|
| S1 | **Nigdy nie usuwaj branchów bezpośrednio z CLI bez backup SHA** | SHA pozwala odtworzyć branch w razie błędu |
| S2 | **`main` jest chroniony — nie dotykać** | Branch produkcyjny z włączonym branch protection |
| S3 | **Przed zamknięciem PR: sprawdź czy nie ma unmerged commits** | GitHub UI wyraźnie to pokazuje |
| S4 | **Branche z „security", „rls", „migration", „pgcrypto" — manual review** | Zmiany bezpieczeństwa i bazy danych wymagają analizy |
| S5 | **Branch z evidence/audit nie może być usunięty, dopóki dane nie są zachowane** | `docs/evidence/screens/2026-02-17` i podobne |
| S6 | **Dependabot PRs — nie zamykaj bez decyzji Roberta** | Mogą zawierać poprawki bezpieczeństwa |
| S7 | **Zamknięcie PR ≠ usunięcie brancha** | Są to dwie osobne operacje. Zamknij PR, poczekaj, potem usuń branch |
| S8 | **Nie usuwaj branchy gdzie PR jest OPEN** | Najpierw zamknij PR, potem usuń branch |
| S9 | **Jeden batch = max 20 branchy/PR na sesję** | Kontrola ryzyka — mniejsze batche, łatwiejszy rollback |
| S10 | **Brak potwierdzenia merge = nie usuwaj** | Jeśli nie widać „merged" w GitHub UI — STOP |

---

## Strategia Cleanup (kolejność)

```
FAZA 1 (najniższe ryzyko):
  → Zamknięcie bardzo starych, oczywiście zbędnych open PRs
     (bez żadnych destructive git actions)

FAZA 2 (po FAZA 1):
  → Usunięcie branchy od już-merged PRs
     (GitHub UI → Pull Requests → Merged → Delete branch)

FAZA 3 (manual review):
  → Decyzja Roberta o Dependabot PRs
  → Decyzja Roberta o open PRs z grup D/E

FAZA 4 (cleanup finalizacja):
  → Usunięcie pozostałych pustych branchy bez PR
```

---

## FAZA 1 — Zamykanie Starych PR-ów (GitHub UI)

### Kryteria kwalifikacji do zamknięcia

PR kwalifikuje się do zamknięcia jeśli WSZYSTKIE poniższe są prawdą:
1. Status: **open** (nie merged, nie closed)
2. Ostatnia aktywność: **starszy niż 60 dni** od dziś (2026-04-14)
3. Brak aktywnych reviewów / comments oczekujących odpowiedzi
4. Treść PR opisuje coś, co **zostało zrobione lepiej w późniejszym PR**
5. Branch HEAD jest **za main** (nie ma unmerged commits wartościowych)

### Kroki GitHub UI

```
1. Otwórz: github.com/robertb1978/majster-ai-oferty/pulls
2. Filtr: "Open" → sortuj "Oldest"
3. Dla każdego PR z listy kandidatów (patrz CANDIDATES doc):
   a. Kliknij w PR
   b. Sprawdź zakładkę "Files changed" — czy zmiany są w main?
   c. Sprawdź "Commits" — ile commitów, jaki ostatni
   d. Jeśli zdecydujesz o zamknięciu:
      → Przewiń na dół do sekcji komentarzy
      → Dodaj komentarz z tekstem (draft przykłady w CANDIDATES doc)
      → Kliknij "Close pull request"
      → NIE klikaj "Delete branch" na tym etapie
4. Zaloguj zamknięte PR# w notatkach
```

### Opcjonalne CLI (read-only sprawdzenie przed zamknięciem)

```bash
# Sprawdź czy branch jest za main (ile commitów do przodu/do tyłu)
git fetch origin
git log --oneline main..origin/<branch-name> | head -5
git log --oneline origin/<branch-name>..main | head -5

# Jeśli druga komenda zwraca wiele linii = branch jest bardzo za main
# Jeśli pierwsza zwraca 0 linii = brak unmerged commits w branch = bezpieczne do zamknięcia
```

---

## FAZA 2 — Usuwanie Branchy od Merged PRs (GitHub UI)

### Metoda: GitHub UI (zalecana — najlepsza widoczność)

```
1. Otwórz: github.com/robertb1978/majster-ai-oferty/pulls?state=closed
2. Filtruj: "Merged"
3. Dla każdego merged PR:
   a. Kliknij PR
   b. Sprawdź czy przy nazwie brancha jest przycisk "Delete branch" lub "Restore branch"
   c. Jeśli "Delete branch" widoczny → branch jeszcze istnieje → możesz usunąć
   d. Kliknij "Delete branch"
4. GitHub automatycznie zapisuje SHA przed usunięciem (można odtworzyć przez "Restore branch")
```

### Metoda: CLI (batch, dla zaawansowanych)

```bash
# UWAGA: Uruchamiaj max 5 na raz, sprawdzaj po każdym batch

# Sprawdź SHA przed usunięciem (ZAWSZE rób to najpierw)
git ls-remote origin <branch-name>

# Usuń pojedynczy branch zdalny
git push origin --delete <branch-name>

# ROLLBACK jeśli usunąłeś błędnie:
# Jeśli znasz SHA:
git push origin <sha>:refs/heads/<branch-name>
# Lub przez GitHub UI: Pull Requests → zamknięty PR → "Restore branch"
```

---

## FAZA 3 — Dependabot PRs (Decyzja Roberta)

Dependabot PR-y wymagają osobnej decyzji:

| Opcja | Co robić | Kiedy |
|-------|----------|-------|
| **Merge** | Kliknij "Merge pull request" po sprawdzeniu CI | Jeśli aktualizacja jest bezpieczna i CI jest zielone |
| **Dismiss** | Zamknij PR, dodaj komentarz "superseded by X" | Jeśli późniejszy Dependabot PR już zawiera tę aktualizację |
| **Ignore** | Nic nie rób | Jeśli planujesz wkrótce robić generalny upgrade deps |

**Branche Dependabot nigdy nie usuwaj ręcznie** — Dependabot zarządza nimi sam.

---

## FAZA 4 — Branche bez PR (orphan branches)

Branche bez żadnego powiązanego PR (ani otwartego, ani zamkniętego) to sieroty.
Przed usunięciem:

```bash
# Sprawdź czy branch ma unmerged commits względem main
git log --oneline main..origin/<branch-name>

# Jeśli wynik pusty = wszystkie commity są w main = safe to delete
# Jeśli wynik NIE jest pusty = sprawdź zawartość commitów RĘCZNIE
```

---

## Rollback i Recovery

### Odtworzenie usuniętego brancha (GitHub UI)

```
Metoda 1 (najłatwiejsza — jeśli był PR):
  1. github.com/robertb1978/majster-ai-oferty/pulls?state=closed
  2. Znajdź PR powiązany z usuniętym branchem
  3. Kliknij PR → kliknij "Restore branch"
  GitHub przechowuje SHA przez minimum 90 dni.

Metoda 2 (CLI — jeśli znasz SHA):
  git push origin <sha>:refs/heads/<recovered-branch-name>

Metoda 3 (GitHub API):
  POST /repos/robertb1978/majster-ai-oferty/git/refs
  {"ref": "refs/heads/<name>", "sha": "<sha>"}
```

### Odtworzenie omyłkowo zamkniętego PR

```
PR zamknięty ≠ PR usunięty.
Zamknięty PR można ponownie otworzyć:
  github.com/robertb1978/majster-ai-oferty/pull/<number>
  → przycisk "Reopen pull request"
  (dostępny jeśli branch nadal istnieje)
```

---

## Twarde Zakazy (BEZWZGLĘDNE)

```
❌ NIGDY nie usuwaj branchów bez sprawdzenia SHA
❌ NIGDY nie usuwaj branchy z "security" / "rls" / "migration" bez manual review
❌ NIGDY nie usuwaj branch fix/remove-sensitive-logging bez audytu zawartości
❌ NIGDY nie usuwaj branch fix/enable-pgcrypto-extension bez audytu migracji
❌ NIGDY nie usuwaj docs/evidence/* bez zachowania danych gdzie indziej
❌ NIGDY nie usuwaj branchy z otwartymi PR-ami
❌ NIGDY nie wykonuj rebase na branchach innych użytkowników
❌ NIGDY nie merge bez zielonego CI
❌ NIGDY nie rób więcej niż 20 operacji w jednej sesji bez pauzy i weryfikacji
```

---

## Uwagi Specjalne — Branche Wysokiego Ryzyka

### fix/remove-sensitive-logging
- **Status**: istnieje jako branch bez merged PR (widoczny w list_branches)
- **Ryzyko**: Może zawierać usunięcie logowania tokenów/sekretów — to jest POZYTYWNA zmiana
- **Zalecenie**: Sprawdź zawartość `git log --oneline main..origin/fix/remove-sensitive-logging` przed jakąkolwiek decyzją
- **Akcja agenta**: BRAK — tylko flag dla Roberta

### fix/enable-pgcrypto-extension
- **Status**: istnieje jako branch
- **Ryzyko**: Dotyczy rozszerzenia bazodanowego — jeśli nie zostało uruchomione w produkcji, branch może zawierać migrację wymaganą do działania funkcji
- **Zalecenie**: Sprawdź czy pgcrypto jest włączone na produkcji PRZED usunięciem
- **Akcja agenta**: BRAK — tylko flag dla Roberta

### docs/evidence/screens/2026-02-17
- **Status**: branch z archiwalnymi screenshotami
- **Ryzyko**: Usunięcie kasuje historyczne dowody z audytu
- **Zalecenie**: Zachowaj pliki w docs/ na main PRZED usunięciem brancha
- **Akcja agenta**: BRAK — decyzja Roberta

### reset/ci-clean
- **Status**: branch czyszczący CI
- **Ryzyko**: Może zawierać zmiany CI/CD które nie trafiły do main
- **Zalecenie**: `git diff main..origin/reset/ci-clean` przed usunięciem

### revert-2-claude/phase-2-stability-011y2VVAevBw5Z77622QrB2w
- **Status**: branch revert
- **Ryzyko**: Revert commit — może być potrzebny jako reference jeśli problem wróci
- **Zalecenie**: Zachowaj do końca Q2 2026, potem usuń

---

## Definicja Ukończenia (DoD) Operacji Cleanup

Operacja sprzątania jest UKOŃCZONA gdy:
- [ ] Inventory zostało zachowane (ten dokument + CANDIDATES)
- [ ] Wszystkie zamknięcia PR są zalogowane (numer PR, data, powód)
- [ ] Wszystkie usunięcia branchy mają zachowane SHA (przed usunięciem)
- [ ] Brak otwartych PR powiązanych z usuniętymi branchami
- [ ] `main` branch jest nienaruszony i zielony w CI
- [ ] Nowa wersja CANDIDATES doc jest zachowana w repozytorium

---

## Harmonogram (Rekomendowany)

| Etap | Kiedy | Co |
|------|-------|-----|
| FAZA 1 | Tydzień 1 | Zamknij ~40 najstarszych open PRs (Dec 2025 batch) |
| FAZA 2 | Tydzień 2 | Usuń branche od merged PRs (batch po 20) |
| FAZA 3 | Tydzień 2-3 | Robert decyduje o Dependabot PRs |
| FAZA 4 | Tydzień 3-4 | Orphan branches — po weryfikacji |
| Review | Koniec | Zaktualizuj CANDIDATES doc o status DONE |

---

## Podział: Agent vs Robert

### Agent robi:
- [x] Inventory read-only (ten dokument + CANDIDATES)
- [x] Klasyfikacja ryzyka
- [x] Przygotowanie draft komentarzy do PR-ów
- [x] Skrypt CLI do weryfikacji stanu branchy (scripts/ops/)

### Robert robi (RĘCZNIE):
- [ ] Zamykanie PR-ów przez GitHub UI
- [ ] Usuwanie branchy przez GitHub UI lub CLI
- [ ] Decyzja o Dependabot PRs
- [ ] Weryfikacja branchy wysokiego ryzyka (security, db)
- [ ] Finalne potwierdzenie każdej operacji destrukcyjnej
