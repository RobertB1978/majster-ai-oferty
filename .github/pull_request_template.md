## Cel PR (1 zdanie)

> _Jeden cel, jasno opisany. Np.: „Dodaje limit 3 ofert/miesiąc na planie Free."_

**Roadmapa:** [`docs/ROADMAP.md`](../docs/ROADMAP.md) | **Status:** [`docs/ROADMAP_STATUS.md`](../docs/ROADMAP_STATUS.md)
**PR numer:** PR-XX | **Faza:** Faza X

---

## Scope Fence

### IN SCOPE (tylko te pliki/foldery)
-

### OUT OF SCOPE (nie ruszam)
-

---

## Definition of Done (DoD)

### CI — No Green, No Finish
- [ ] `npm run lint` → 0 błędów
- [ ] `npm test` → wszystkie testy zielone
- [ ] `npm run build` → OK
- [ ] `npm run type-check` → 0 błędów TypeScript
- [ ] `npm audit --audit-level=high` → 0 wysokich CVE

### Jakość
- [ ] i18n: zero hardcoded tekstów (PL/EN/UK)
- [ ] RLS: nowe tabele mają polityki + test IDOR (2 konta)
- [ ] Walidacja Zod na formularzach
- [ ] Typy TypeScript bez `any`
- [ ] Brak zmian „przy okazji" poza scope fence

### FF_NEW_SHELL (wypełnij od PR-07)
- [ ] Działa przy `FF_NEW_SHELL=true`
- [ ] Działa przy `FF_NEW_SHELL=false`
- [ ] _(N/A — ten PR jest przed PR-07)_

### Dokumentacja
- [ ] `docs/ROADMAP_STATUS.md` zaktualizowany po merge
- [ ] ADR dodany jeśli podjęto istotną decyzję architektoniczną

---

## Opis zmian

### Co robi ten PR
-

### Dlaczego (wartość dla użytkownika / biznesu)
-

### Jak to działa (krótko, dla laika)
> _Np.: „Aplikacja liczy wysłane oferty. Gdy jest ich 3 w miesiącu, pokazuje modal z propozycją upgrade'u."_

---

## Dowody / weryfikacja (wklej output)

```
# npm run lint
...

# npm test
...

# npm run build
...
```

---

## Rollback plan

1. _(Opisz kroki przywrócenia do stanu przed PR)_
2.
3.

**Migracje odwracalne?** TAK / NIE — _(wyjaśnij jeśli NIE)_

---

## Ryzyka i wpływ

| Ryzyko | Prawdopodobieństwo | Mitygacja |
|--------|-------------------|-----------|
| | | |

---

## Powiązane

- Roadmapa PR: `docs/ROADMAP.md` → sekcja PR-XX
- ADR (jeśli dotyczy): `docs/ADR/ADR-XXXX-*.md`
- Issue / dyskusja: _(link)_

---

> **Przypomnienie:** Po merge zaktualizuj `docs/ROADMAP_STATUS.md` — zmień status PR-XX na ✅ DONE i wpisz datę merge.
