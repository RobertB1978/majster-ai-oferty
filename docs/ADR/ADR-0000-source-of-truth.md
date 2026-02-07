# ADR-0000: ROADMAP_ENTERPRISE.md jako Source of Truth

- **Status:** Accepted
- **Data:** 2026-02-05
- **Decydenci:** Product Owner, Tech Lead

## Kontekst
W repo istnieje wiele dokumentów planistycznych i audytowych. Bez jednego dokumentu nadrzędnego łatwo o niespójność decyzji wdrożeniowych (Vercel/Supabase), scope creep i PR-y bez porównywalnych dowodów.

## Decyzja
`docs/ROADMAP_ENTERPRISE.md` jest od teraz **jedynym dokumentem nadrzędnym** do:
1. kolejności prac (PR#00–PR#04),
2. kryteriów jakości (DoD, testy, rollback),
3. mapowania ryzyk i ich domknięcia.

Pozostałe dokumenty są pomocnicze i muszą być z nim spójne.

## Konsekwencje
### Pozytywne
- Jedno miejsce decyzyjne.
- Łatwiejsze review i mniej niejasności.
- Lepsza audytowalność (traceability).

### Negatywne / koszt
- Trzeba utrzymywać aktualność master-dokumentu.
- Każda zmiana priorytetów wymaga aktualizacji roadmapy.

## Dokumenty pomocnicze
| Dokument | Rola |
|----------|------|
| `docs/DEPLOYMENT_TRUTH.md` | Stan wdrożenia — PASS/FAIL Vercel + Supabase |
| `docs/TRACEABILITY_MATRIX.md` | Mapping: wymaganie → kod → PR → test → status |
| `docs/PR_PLAYBOOK.md` | Proces PR — szablon, zasady, workflow |
| `docs/PRODUCT_SCOPE.md` | Zakres produktu — moduły, priorytety |

## Zasada aktualizacji
Przy każdym PR:
1. Zaktualizuj `TRACEABILITY_MATRIX.md` (zmień status wymagań)
2. Zaktualizuj `ROADMAP_ENTERPRISE.md` (zmień status PR)
3. Jeśli dotyczy wdrożenia: zaktualizuj `DEPLOYMENT_TRUTH.md`
