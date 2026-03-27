# Deployment Truth Audit — Majster.AI

**Data audytu:** 2026-03-27
**Cel:** Ustalenie, które zmiany faktycznie trafiły na produkcję.

---

## Stan głównej gałęzi (main)

- **Aktualny HEAD main:** `8e8acf4` (PR #510) — 2026-03-27 08:53
- **Platforma deploy:** Vercel — auto-deploy z gałęzi `main`
- **Każdy merge do main = nowy production deploy**

---

## Chronologia kluczowych revertów

| # | Commit | Data | Co zrobił |
|---|--------|------|-----------|
| 1 | `003aab2` (#486) | 24.03 16:31 | Revert PR #485 (useBlocker) |
| 2 | `cd4e742` (#489) | 25.03 07:21 | Revert PR #481–#488 → stan PR #480 |
| 3 | `44c29e8` (bez PR) | 26.03 06:03 | Revert PR #477–#490 → stan PR #476 (`0501f76`) |

**Wniosek:** Commit `44c29e8` cofnął WSZYSTKO od PR #477 do #490 włącznie.
Potem na tej bazie (stan `0501f76`) nabudowano PR #491–#510.

---

## Tabela: Fixy startup/auth/boot/redirect

| PR | Opis | SHA | Merge do main | Był deploy (tymcz.) | Na produkcji TERAZ | Wpływ |
|----|------|-----|---------------|---------------------|-------------------|-------|
| #477 | Naprawa 11 błędów projekty/oferty | `437a8b1` | TAK | TAK | NIE (cofnięty) | BRAK |
| #478 | Naprawa 11 krytycznych błędów auth | `a6c8283` | TAK | TAK | NIE (cofnięty) | BRAK |
| #479 | Enterprise audit, P0 crash fix | `ad110d3` | TAK | TAK | NIE (cofnięty) | BRAK |
| #480 | Post-audit cleanup | `80787e8` | TAK | TAK | NIE (cofnięty) | BRAK |
| #481 | Splash screen freeze fix | `25ae17f` | TAK | TAK | NIE (cofnięty) | BRAK |
| #482 | Login race condition fix | `d9cc9cf` | TAK | TAK | NIE (cofnięty) | BRAK |
| #483 | Splash freeze + www→apex redirect | `b96294e` | TAK | TAK | NIE (cofnięty) | BRAK |
| #484 | Redirect loop fix (vercel.json) | `260c561` | TAK | TAK | NIE (cofnięty) | BRAK |
| #485 | useBlocker crash fix | `8e7bcee` | TAK | TAK | NIE (cofnięty) | BRAK |
| #486 | Revert PR #485 | `003aab2` | TAK | TAK | NIE (cofnięty) | BRAK |
| #487 | DraftContext + useBlocker crash | `e14c67e` | TAK | TAK | NIE (cofnięty) | BRAK |
| #488 | Lazy providers, es2020, CSP | `77cb3cf` | TAK | TAK | NIE (cofnięty) | BRAK |
| #489 | REVERT #481-#488 | `cd4e742` | TAK | TAK | NIE (cofnięty) | BRAK |
| #490 | Cache-Control no-store | `b2140c3` | TAK | TAK | NIE (cofnięty) | BRAK |
| — | **Revert do `0501f76`** | `44c29e8` | TAK (direct push) | TAK | **TAK — BAZA** | ✅ |
| #491 | NIP klienta + IDOR test | `367a1b5` | TAK | TAK | **TAK** | ✅ |
| #492–#509 | Feature PRs (roadmap) | `fea709b`–`f26112b` | TAK | TAK | **TAK** | ✅ |
| #510 | Lazy-load layout (startup fix) | `8e8acf4` | TAK | TAK | **TAK** | ✅ |
| #506 | pdf-migration finish | — | NIE (open) | NIEPEWNE | **NIE** | BRAK |

---

## Werdykt operacyjny

1. **Aktualny stan produkcji** = commit `0501f76` (PR #476) + PR #491–#510.

2. **ŻADEN z fixów startup/auth/boot z PR #477–#490 nie jest na produkcji.**
   Wszystkie zostały cofnięte commitem `44c29e8`.

3. **Jedyny aktywny fix startu** to PR #510 — lazy-load layoutów w App.tsx.

4. **Fixy z PR #477–#480** (audit, P0 crash, i18n, bundle) też zostały cofnięte.

5. **PR #506** — jedyny niezmergowany PR. Nie wpłynął na produkcję.

6. **Produkcja = PR #476 (stary stabilny stan) + 20 nowych feature PR-ów (#491–#510).**
