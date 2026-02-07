# PR_PLAYBOOK.md

## Zasada główna
**1 objaw → 1 minimal fix → 1 PR → te same komendy weryfikacji → STOP.**

## Scope Fence (obowiązkowe w każdym PR)
1. Co wolno zmienić (lista plików/folderów).
2. Czego nie wolno zmienić (explicit out-of-scope).
3. Zakaz „przy okazji" refaktorów.

## DoD (Definition of Done)
- [ ] Problem opisany jednym zdaniem.
- [ ] Minimalna poprawka wdrożona.
- [ ] Testy/komendy uruchomione i wklejone w PR.
- [ ] Ryzyka i wpływ opisane.
- [ ] Plan rollback gotowy.

## Stałe komendy weryfikacji
```bash
npm run lint
npm run test
npm run build
npm run type-check
```

## Rollback (minimum)
1. Revert commit/PR.
2. Potwierdzenie, że środowisko wróciło do stanu sprzed zmiany.
3. Krótki postmortem: co poprawić w kolejnym PR.

## Kiedy STOP
Jeśli podczas pracy wychodzi drugi problem — **nie dopisuj go do tego PR**.
Dodaj do backlogu jako nowy, atomowy PR.

## Max LOC
- **Preferowane**: < 120 LOC, < 10 plików
- **Maximum**: 200-300 LOC
- **Wyjątki**: wygenerowany kod, migracje, aktualizacje zależności

## Naming
- **Branch**: `claude/<opis>-<session-id>`
- **Commit**: `<type>(<scope>): <opis>`
- Types: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`

## Workflow
1. `git checkout main && git pull origin main`
2. `git checkout -b claude/<opis>-<session-id>`
3. Zmiany + testy lokalne
4. `npm run lint && npm test && npm run build && npm run type-check`
5. PR z wypełnionym template
6. Review → Green checks → Merge
7. Zaktualizuj `TRACEABILITY_MATRIX.md` i `ROADMAP_ENTERPRISE.md`

## Related
- Template: `.github/pull_request_template.md`
- Roadmap: `docs/ROADMAP_ENTERPRISE.md`
