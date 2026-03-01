# ADR-0000: ROADMAP.md jako Source of Truth (zaktualizowano 2026-03-01)

- **Status:** Zaktualizowany — AKTYWNY
- **Data pierwotna:** 2026-02-05
- **Data aktualizacji:** 2026-03-01 (PR-00 Roadmap-as-code v5)
- **Decydenci:** Product Owner (Robert B.), Tech Lead (Claude)

## Historia

| Wersja | Data | Dokument nadrzędny | Zakres |
|--------|------|-------------------|--------|
| v1–v4 | 2026-02-05 | `docs/ROADMAP_ENTERPRISE.md` | PR#00–PR#05 |
| **v5** | **2026-03-01** | **`docs/ROADMAP.md`** | **PR-00–PR-20 (cały 2026)** |

## Kontekst
W repo istnieje wiele dokumentów planistycznych i audytowych. Bez jednego dokumentu nadrzędnego łatwo o niespójność decyzji wdrożeniowych, scope creep i PR-y bez porównywalnych dowodów.

Od 2026-03-01 roadmapa została rozszerzona z 5 do 21 PR (PR-00..PR-20), obejmując pełny plan produktu na rok 2026.

## Decyzja (v5 — obowiązuje od 2026-03-01)

**`docs/ROADMAP.md` (v5) jest jedynym dokumentem nadrzędnym** do:
1. Kolejności prac (PR-00..PR-20)
2. Reguł globalnych (G1-G10)
3. Kryteriów jakości (DoD per PR)
4. Zależności między PR-ami

`docs/ROADMAP_ENTERPRISE.md` (v4) jest zachowany jako archiwum historyczne — **nie aktualizować**.

## Dokumenty pomocnicze (aktualne)
| Dokument | Rola |
|----------|------|
| `docs/ROADMAP_STATUS.md` | Tracker statusów PR-00..PR-20 (aktualizuj po każdym merge) |
| `docs/ADR/` | Decyzje architektoniczne (ADR-0000..ADR-0009+) |
| `docs/DEPLOYMENT_TRUTH.md` | Stan wdrożenia — PASS/FAIL Vercel + Supabase |
| `docs/TRACEABILITY_MATRIX.md` | Mapping: wymaganie → kod → PR → test → status |
| `docs/PR_PLAYBOOK.md` | Proces PR — szablon, zasady, workflow |

## Zasada aktualizacji (v5)
Przy każdym merge:
1. Zaktualizuj `ROADMAP_STATUS.md` (status + link PR + data merge)
2. Jeśli zmieniono zakres: stwórz nowy ADR + zaktualizuj `ROADMAP.md`
3. Jeśli dotyczy wdrożenia: zaktualizuj `DEPLOYMENT_TRUTH.md`

## Konsekwencje
### Pozytywne
- Jedno miejsce decyzyjne dla wszystkich 21 PR
- Łatwiejsze review i mniej niejasności
- Lepsza audytowalność (traceability)
- Cały plan 2026 w jednym pliku

### Negatywne / koszt
- Trzeba utrzymywać aktualność `ROADMAP.md` i `ROADMAP_STATUS.md`
- Każda zmiana zakresu wymaga ADR i aktualizacji roadmapy
