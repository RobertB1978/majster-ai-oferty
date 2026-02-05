# ADR-0001: Aktualny stack repo = Vite/React/TypeScript (fakt)

- Status: Accepted
- Data: 2026-02-05
- Decydenci: Zespół Majster.AI
- Powiązanie: `docs/ROADMAP_ENTERPRISE.md` (source of truth)

## Kontekst
W repo istnieje `vite.config.ts` i skrypty build/test uruchamiane przez Vite/Vitest/TypeScript.
Nie znaleziono `next.config.*`.

## Decyzja
Traktujemy **Vite + React + TypeScript** jako aktualny, obowiązujący stan faktyczny projektu.

## Konsekwencje
1. Roadmapa i decyzje techniczne muszą bazować na stanie faktycznym repo, nie na założeniu Next.js.
2. Ewentualna migracja do Next.js (jeśli kiedykolwiek potrzebna) jest osobnym etapem i osobnym PR/epikiem.
3. P0 „Deployment Truth” rozliczamy dla istniejącej architektury Vite/React/TS, bez scope creep.

## Dowody repo
- `vite.config.ts` istnieje.
- `package.json` używa `vite`, `vitest`, `tsc`.
- Brak `next.config.js|mjs|ts`.
