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

