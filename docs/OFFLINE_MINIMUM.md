# Majster.AI — Offline Minimum (PR-19)

> Dokument opisuje co dziala w trybie offline, co nie dziala i jak dziala cachowanie.

---

## Co dziala offline (read-only)

| Widok | Zachowanie offline |
|-------|-------------------|
| **Lista ofert** (`/app/offers`) | Wyswietla ostatnie pobrane dane z cache SW |
| **Szczegol projektu** (`/app/projects/:id`) | Wyswietla ostatnio pobrane dane projektu |
| **App shell (nawigacja)** | Dostepna z cache (index.html + statyczne assety) |
| **Wszelkie statyczne zasoby** | JS/CSS/ikony z cache |

## Co NIE dziala offline

| Akcja | Zachowanie |
|-------|-----------|
| Tworzenie nowej oferty | Blad sieci (Supabase niedostepny) |
| Wysylanie oferty emailem | Blad sieci |
| Edycja oferty/projektu | Zapis do Supabase nieudany |
| Generowanie linku QR | Blad sieci |
| Upload zdjec/dokumentow | Blad sieci |
| Logowanie / rejestracja | Blad sieci (Auth Supabase) |

Aplikacja wyswietla maly baner **"Tryb offline"** u gory ekranu — uzytkownik wie, ze jest offline.

---

## Jak dziala cachowanie

### Service Worker v4 (`public/sw.js`)

```
Warstwa 1: App shell (SHELL_CACHE = majster-ai-shell-v4)
  - Adresy: /, /index.html, /manifest.json, /icon-*.png
  - Strategia: cache-first dla statycznych zasobow
               network-first dla nawigacji (fallback do /index.html)

Warstwa 2: Statyczne assety JS/CSS/img (STATIC_CACHE = majster-ai-static-v4)
  - Pasuje do: *.js, *.css, *.png, *.svg, *.woff2, itp.
  - Strategia: cache-first (serwuje z cache, aktualizuje przy kolejnym odswiezeniu)

Warstwa 3: Dane API Supabase (API_CACHE = majster-ai-api-v4)
  - Pasuje do:
      /rest/v1/offers?...        (lista ofert)
      /rest/v1/v2_projects?...   (lista + szczegol projektu)
  - Strategia: stale-while-revalidate
      -> Jesli dane sa w cache: serwuj natychmiast (offline dziala)
      -> Rownolegle: zaktualizuj cache z sieci (gdy online)
  - Wszystkie inne Supabase (mutacje, auth, storage): pass-through bez cachowania
```

### TanStack Query

Dane sa rowniez trzymane w pamieci przez TanStack Query:
- `staleTime`: 5 min (nie odswiezaj jesli dane swiezsze niz 5 min)
- `gcTime`: 30 min (dane w pamieci przez 30 min po unmount)

**Wazne:** TanStack Query cache jest w pamieci RAM — ginie po przeladowaniu strony.
Tylko Service Worker zapewnia trwalosc danych po przeladowaniu.

---

## Jak weryfikowac offline (kroki reczne)

1. Otwórz aplikacje w przegladarce (Chrome/Edge)
2. Zaloguj sie i wejdz na `/app/offers` — poczekaj az dane sie zaladuja
3. Wejdz na `/app/projects/:id` dowolnego projektu — poczekaj az dane sie zaladuja
4. Otwórz DevTools → Network → wlacz **Offline** (lub tryb samolotowy na urzadzeniu)
5. Przeladuj strone (`F5` lub adres URL)
6. **Oczekiwany wynik:**
   - Baner "Tryb offline" widoczny u gory (zolte tlo)
   - Lista ofert wyswietla poprzednio zaladowane dane
   - Szczegol projektu wyswietla poprzednio zaladowane dane
   - Próba akcji sieciowej (np. "Wyslij oferte") konczy sie bledem Supabase (brak polaczenia)

---

## Ograniczenia MVP

- **Brak synchronizacji w tle** (background sync) — zapis offline nie jest obslugiw
- **Brak kolejki zmian** — zmiany wprowadzone offline sa tracone
- **Cache ma czas zycia**: dane sa dostepne offline tak dlugo, jak SW nie zostanie zaktualizowany lub Storage nie wyczyszczone
- **Pierwsze uruchomienie offline**: jesli uzytkownik nigdy nie odwiedzil listy ofert w trybie online, nie bedzie co pokazac w trybie offline

---

*Dokument: PR-19 | Data: 2026-03-02 | Zakres: read-only offline dla listy ofert i szczegolu projektu*
