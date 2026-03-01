# ADR-0008: PWA Offline — zakres minimum (read-only)

- **Status:** Zaakceptowany
- **Data:** 2026-03-01
- **Decydenci:** Product Owner (Robert B.), Tech Lead (Claude)
- **Związany PR:** PR-19 (PWA Offline minimum)

---

## Kontekst

Majster pracuje na budowach, w piwnicach, tunelach — miejscach bez LTE.
Problem: apka jest całkowicie bezużyteczna bez internetu.

Pytanie: ile funkcji offline wdrożyć i jak obsłużyć konflikty danych?

---

## Decyzja

**Minimum offline = wyłącznie tryb read-only dla kluczowych ekranów.**

### W zakresie PR-19:

| Funkcja | Offline dostępna | Technologia |
|---------|-----------------|-------------|
| Lista ofert (ostatnie 20) | ✅ TAK | Service Worker + Cache API |
| Szczegół oferty | ✅ TAK | Service Worker + Cache API |
| Szczegół projektu | ✅ TAK | Service Worker + Cache API |
| Tworzenie nowej oferty | ❌ NIE | Wymaga serwera |
| Edycja istniejącej oferty | ❌ NIE | Ryzyko konfliktu |
| Wysyłka emailem | ❌ NIE | Wymaga serwera |
| Synchronizacja offline-edits | ❌ NIE | Za złożone |

**Komunikat UI:** baner/toast „Tryb offline — dane mogą być nieaktualne" gdy brak sieci.

---

## Uzasadnienie ograniczonego zakresu

Synchronizacja offline z edycją to jeden z najtrudniejszych problemów w inżynierii oprogramowania:
- Konflikty merge (user edytuje offline, a ktoś inny online)
- Kolejkowanie mutacji (background sync)
- Obsługa błędów przy przywróceniu sieci

Dla Majster.AI w 2026:
- Użytkownicy są solo (rzadko konflikt z inną osobą)
- Ale ryzyko konfliktu własnych edycji (tablet offline + telefon online) istnieje
- Koszt implementacji > wartość dla użytkownika na tym etapie

---

## Alternatywy rozważane

| Opcja | Powód odrzucenia |
|-------|-----------------|
| Pełny offline z sync | Zbyt złożone (konflikty, kolejkowanie) — osobny PR/ADR |
| Tylko lista ofert (bez szczegółów) | Za mała wartość dla majstra w piwnicy |
| IndexedDB z background sync | Nadmiarowe dla read-only; zostawione na przyszłość |
| Natywna app (bez PWA) | Capacitor już jest — ale Store review proces spowalnia |

---

## Konsekwencje

### Pozytywne
- „Piwnica bez zasięgu" przestaje być problemem dla przeglądania
- Prosta implementacja (Workbox/vite-pwa-plugin)
- Brak ryzyka konfliktu danych

### Negatywne / ryzyki
- Użytkownik nie może tworzyć offline — może być frustrujące
- Dane w cache mogą być nieaktualne (akceptowalne przy read-only)
- Cache ma limit rozmiaru na iOS Safari (~50MB) — tylko ostatnie 20 ofert

### Implementacja
```typescript
// vite.config.ts (vite-plugin-pwa)
VitePWA({
  strategies: 'generateSW',
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /\/api\/offers/,
        handler: 'NetworkFirst',
        options: { cacheName: 'offers-cache', expiration: { maxEntries: 20 } }
      }
    ]
  }
})
```

---

## Rozszerzenie w przyszłości

„Offline FULL" (tworzenie i edycja offline z sync) to osobny milestone — **poza zakresem roadmapy 2026**. Wymaga nowego ADR i znaczącego nakładu pracy (szacunkowo medium-large PR).

---

*ADR-0008 | 2026-03-01 | Majster.AI*
