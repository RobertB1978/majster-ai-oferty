# AGENTS.md

Zakres: całe repozytorium.

## Zasady procesu (obowiązkowe)
1. **Zakaz push bezpośrednio na `main`.** Praca tylko na branchu roboczym.
2. **Merge tylko przez PR** po review.
3. **Merge dopiero po green checks** (minimum: lint, test, build, type-check).
4. **1 PR = 1 cel.** Bez scope creep.
5. Każdy PR musi mieć: Scope Fence, DoD, testy, rollback, ryzyka.

## Zasady bezpieczeństwa zmian
- Nie modyfikuj migracji historycznych.
- Nie wdrażaj runtime/config „przy okazji” PR-a docs-only.
- W przypadku konfliktu priorytet ma `docs/ROADMAP_ENTERPRISE.md` (source of truth).

