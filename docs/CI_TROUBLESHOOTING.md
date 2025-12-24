# CI / Lokalna diagnostyka

Szybka ściągawka jak odblokować pipeline (lint/typy/testy/build/e2e).

## ESLint / TypeScript

- Uruchom pełny zestaw: `npm run lint && npm run type-check`.
- Typowe przyczyny:
  - **Brak zależności w hookach** – dodaj brakujące wartości do tablicy dependencies albo wyciągnij funkcje do `useCallback`.
  - **`react-refresh/only-export-components`** – przenieś współdzielone stałe/utility do osobnego pliku, zostawiając w pliku komponentów tylko komponenty.
  - **Nieprawidłowe typy** – unikaj `any`; preferuj konkretne typy/`unknown` + guardy.
- Po poprawkach: `npm run lint:fix` (opcjonalnie), potem `npm run type-check` weryfikuje typy.

## Testy jednostkowe / integracyjne

- `npm test -- --coverage` – lokalnie odpowiada jobowi "CI/CD Pipeline / Run Tests".
- Jeśli testy funkcji Supabase padają, sprawdź czy masz ustawione zmienne z `.env.example` (zwłaszcza klucze Supabase).
- Różnice środowiskowe: Vitest korzysta z `jsdom`, więc upewnij się, że testy nie polegają na API tylko dla przeglądarki bez mocków.

## Build

- `npm run build` – odpowiada jobowi "CI/CD Pipeline / Build Application".
- Najczęstsze problemy:
  - Brak zmiennych `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
  - Importy o złej wielkości liter (ci-only na Linuxie).
  - Złe eksporty domyślne (`default` vs named).

## Playwright (E2E)

- `npm run e2e` lub `npx playwright test --trace on` lokalnie.
- Dev serwer musi wystartować na `http://127.0.0.1:8080`:
  - Port/host są wymuszane w `vite.config.ts` i `playwright.config.ts`.
  - Jeśli nie masz `.env`, Playwright poda bezpieczne demowe dane Supabase, więc serwer się nie wywali na walidacji.
- Jeśli serwer nie startuje w 60s:
  - Sprawdź logi global setup (`e2e/global-setup.ts`).
  - Zweryfikuj, że port 8080 jest wolny lub ustaw `PORT=8080 HOST=127.0.0.1 npm run dev`.
  - Możesz wydłużyć timeout startu lokalnie: `npx playwright test --timeout 240000`.
- Debug UI: `npm run e2e:ui` (uruchamia Playwright Inspector).

## Supabase Edge Functions

- Lint/typy nie obejmują ich w TS pipeline – do szybkiej weryfikacji użyj:
  - `npm run lint supabase/functions/**/*.ts` (manualne uruchomienie ESLint z globem) lub
  - `deno lint supabase/functions/**/*.ts` jeśli masz Deno.
- Pamiętaj o sekretach: funkcje wymagają `SUPABASE_SERVICE_ROLE_KEY` i ewentualnie kluczy zewnętrznych (np. `RESEND_API_KEY`, `STRIPE_SECRET_KEY`) – na CI używaj sekretów GitHub/Supabase, nigdy lokalnie w repo.
