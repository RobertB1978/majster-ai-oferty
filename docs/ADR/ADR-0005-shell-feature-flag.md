# ADR-0005: Nowy shell aplikacji za flagą FF_NEW_SHELL

- **Status:** Zaakceptowany
- **Data:** 2026-03-01
- **Decydenci:** Product Owner (Robert B.), Tech Lead (Claude)
- **Związany PR:** PR-07 (Shell aplikacji)

---

## Kontekst

PR-07 wprowadza nową strukturę nawigacji (dolny nav, FAB, Home screen).
Jest to zmiana obejmująca cały szkielet aplikacji — jeden z najwyższych ryzyk w projekcie.

Problem: jak wdrożyć tak dużą zmianę bez ryzyka „broken main" i bez konieczności blokowania innych prac?

---

## Decyzja

Nowy shell aplikacji jest wdrażany za **feature flagiem `FF_NEW_SHELL`**.

```typescript
// Plik: src/lib/featureFlags.ts
export const FF_NEW_SHELL = process.env.VITE_FF_NEW_SHELL === 'true';

// Użycie w App.tsx
function App() {
  return FF_NEW_SHELL ? <NewShell /> : <LegacyShell />;
}
```

**Reguła od PR-07 do PR-20:**
> Każdy PR (PR-08..PR-20) MUSI działać poprawnie zarówno przy `FF_NEW_SHELL=true`, jak i `FF_NEW_SHELL=false`.
> Jest to weryfikowane w CI jako obowiązkowy check.

**Środowiska:**
- `development`: `FF_NEW_SHELL=true` (deweloperzy pracują na nowym shellu)
- `staging`: `FF_NEW_SHELL=true` (testy na nowym shellu)
- `production`: `FF_NEW_SHELL=false` → `true` (przełączane przez Owner'a po weryfikacji)

---

## Alternatywy rozważane

| Opcja | Powód odrzucenia |
|-------|-----------------|
| Big Bang (jedna gałąź, wszystko naraz) | Zbyt wysokie ryzyko regresu w całej app |
| Stopniowe zastępowanie komponent po komponencie | Długi okres niespójnego UI — zła UX |
| Osobna gałąź long-lived | Merge conflict hell po tygodniach pracy |
| Canary release (% użytkowników) | Nadmiarowa złożoność dla obecnego etapu |

---

## Konsekwencje

### Pozytywne
- Main zawsze deployowalny — stary shell działa bez zmian
- Możliwość przełączenia w każdej chwili bez deployu (env var)
- Testowanie nowego shellu równolegle ze starym

### Negatywne / ryzyki
- Podwójne utrzymanie (stary + nowy shell) przez okres PR-07..PR-20
- Każdy PR wymaga testów dla dwóch konfiguracji (overhead ~15-20%)
- Ryzyko: feature wchodzi tylko w jednej konfiguracji → CI musi to łapać

### Usunięcie flagi
Flaga `FF_NEW_SHELL` zostanie usunięta po:
1. PR-20 jest zmerge'owany
2. Produkcja działa stabilnie przez 2 tygodnie z `FF_NEW_SHELL=true`
3. Owner zatwierdził usunięcie starego shellu
4. Tworzony jest osobny PR: `PR-21: Usuń FF_NEW_SHELL i legacy shell`

---

*ADR-0005 | 2026-03-01 | Majster.AI*
