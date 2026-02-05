# ADR-0001: Aktualny stack repo to Vite/React/TypeScript (fakt)

- Status: Accepted
- Data: 2026-02-05
- Decydenci: Zespół Majster.AI
- Powiązania: `docs/ROADMAP_ENTERPRISE.md`, `docs/DEPLOYMENT_TRUTH.md`

## Kontekst
W repo znajdują się artefakty typowe dla Vite + React + TS (m.in. `vite.config.ts`, skrypty `vite` w `package.json`) i nie ma plików `next.config.*`.

## Decyzja
Przyjmujemy jako fakt, że **aktualny stack repo to Vite/React/TypeScript**.

## Konsekwencje
1. Roadmapa i decyzje wdrożeniowe muszą bazować na tym fakcie.
2. Założenia „to jest Next.js” są nieaktualne, dopóki nie powstanie osobny plan migracji.
3. Ewentualna migracja do Next.js (jeśli będzie potrzebna) to **osobny etap i osobny PR/epik**, nie element bieżącego P0.
4. W dokumentach deploymentowych należy używać nomenklatury zgodnej z Vite.

## Alternatywy odrzucone
- „Traktować projekt jako Next.js już teraz” — odrzucone, bo brak zgodnych artefaktów w repo.
