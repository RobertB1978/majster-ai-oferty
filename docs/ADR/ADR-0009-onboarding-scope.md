# ADR-0009: Onboarding — lekki guided tour (3 kroki, jednorazowy)

- **Status:** Zaakceptowany
- **Data:** 2026-03-01
- **Decydenci:** Product Owner (Robert B.), Tech Lead (Claude)
- **Związany PR:** PR-07 (Shell aplikacji + onboarding)

---

## Kontekst

Nowi użytkownicy Majster.AI (rzemieślnicy, budowlańcy) często nie są obeznani z aplikacjami SaaS.
Bez żadnego onboardingu mogą nie wiedzieć od czego zacząć i porzucić aplikację w ciągu pierwszych minut.

Pytanie: ile i jaki onboarding wdrożyć?

---

## Decyzja

**Onboarding = lekki guided tour, maksymalnie 3 kroki, wyświetlany jednorazowo po pierwszym logowaniu.**

### Zakres 3 kroków (PR-07):

| Krok | Treść | Cel |
|------|-------|-----|
| 1 | „Uzupełnij profil firmy → dane trafią do PDF" | Akcja: przejdź do ustawień |
| 2 | „Stwórz pierwszą ofertę — to trwa 3 minuty" | Akcja: przejdź do ofert |
| 3 | „Gotowe! Możesz też połączyć Google/Apple" | Akcja: zamknij lub idź do Social Login |

**Zachowanie:**
- Wyświetla się tylko raz (zapisane w `localStorage: onboarding_completed = true`)
- Można pominąć (X) w dowolnym momencie
- Nie blokuje korzystania z aplikacji
- Nie zbiera danych ani nie wymaga odpowiedzi

---

## Poza zakresem PR-07 (nie implementować):

- ❌ Checklist z punktami do ukończenia (gamification)
- ❌ Interaktywny tour z tooltipami na elementach UI
- ❌ Personalizacja na podstawie typu działalności
- ❌ Email powitalny z krokami
- ❌ Pushy z przypomnieniami
- ❌ Video tutorial

---

## Alternatywy rozważane

| Opcja | Powód odrzucenia |
|-------|-----------------|
| Brak onboardingu | Nowi użytkownicy gubią się — wysoki churn |
| Rozbudowany wizard (5-10 kroków) | Za dużo tarcia przy pierwszym użyciu |
| Interaktywny tour (tooltip-based) | Drogi w implementacji i utrzymaniu |
| Gamified checklist | Ciekawe, ale poza zakresem MVP — osobny PR |
| Email sekwencja | Wymaga dodatkowej infrastruktury — poza zakresem |

---

## Konsekwencje

### Pozytywne
- Minimalne tarcie — 3 kroki to maksimum uwagi nowego użytkownika
- Jednorazowość — nie irytuje powracających użytkowników
- Prosta implementacja i utrzymanie

### Negatywne / ryzyki
- Może być zbyt uproszczony dla kompleksowych funkcji
- Użytkownik może pominąć i nie wiedzieć o ważnych funkcjach
- (Akceptowalne — mamy też tooltips i dokumentację pomocniczą)

### Implementacja
```typescript
// src/components/onboarding/OnboardingTour.tsx
const ONBOARDING_KEY = 'majster_onboarding_v1';

function OnboardingTour() {
  const [show, setShow] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) !== 'completed'
  );

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'completed');
    setShow(false);
  };

  if (!show) return null;
  return <OnboardingModal steps={ONBOARDING_STEPS} onComplete={handleComplete} />;
}
```

---

## Rozszerzenie w przyszłości

Rozbudowany onboarding (checklist, gamification, email sekwencja) to osobny feature — **poza zakresem roadmapy 2026**. Wymaga danych o tym, gdzie użytkownicy rezygnują (analytics → Sentry + events).

---

*ADR-0009 | 2026-03-01 | Majster.AI*
