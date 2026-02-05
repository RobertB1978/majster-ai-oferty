# PR_PLAYBOOK.md

## Zasada główna
**1 objaw → 1 minimal fix → 1 PR → te same komendy weryfikacji → STOP.**

## Scope Fence (obowiązkowe w każdym PR)
1. Co wolno zmienić (lista plików/folderów).
2. Czego nie wolno zmienić (explicit out-of-scope).
3. Zakaz „przy okazji” refaktorów.

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

