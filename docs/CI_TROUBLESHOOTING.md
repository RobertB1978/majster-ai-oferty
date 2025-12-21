# CI Troubleshooting (Majster.AI)

Praktyczne porady do najczęstszych awarii pipeline’ów.

## Playwright (E2E)
- **Objaw:** testy wiszą na starcie serwera.
- **Fix:** konfiguracja używa `npm run preview -- --host 127.0.0.1 --port 4173` (patrz `playwright.config.ts`). Upewnij się, że port 4173 nie jest zajęty.
- **Objaw:** testy skipują się z komunikatem o Supabase.
- **Fix:** ustaw `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` (GitHub Secrets dla CI, `.env` lokalnie). Bez nich suite skipuje się świadomie, zamiast się wysypywać.
- **Debug artefakty:** raport HTML + trace + video są zawsze uploadowane w jobie `e2e.yml` jako `playwright-report` i `playwright-artifacts`.

## npm audit / security scans
- **Objaw:** `npm audit` zwraca `403 Forbidden - registry.npmjs.org/-/npm/v1/security/advisories/bulk`.
- **Fix:** usuń niestandardowe proxy z konfiguracji npm (`npm config delete http-proxy`), uruchom ponownie `npm audit --audit-level=moderate`.
- **CI:** w `ci.yml` i `security.yml` `continue-on-error` jest ustawione na `false` dla poziomu moderate → brak proxy = brak false-positive failów.

## Build (Vite 7 + Supabase)
- **Objaw:** błąd `default is not exported by @supabase/supabase-js/dist/module/index.js`.
- **Fix:** alias do modułu Supabase jest zdefiniowany w `vite.config.ts` (`@supabase/supabase-js` → `dist/module/index.js`). Nie usuwaj go przy aktualizacjach Vite/Supabase, bo build ponownie się wysypie.

## Bundle size
- **Komenda:** `npm run size:check` (wymaga istniejącego `dist/`).
- **Budżety:** `dist/assets/js/index-*.js` ≤ 550 kB brotli, `dist/assets/js/react-vendor-*.js` ≤ 320 kB brotli (patrz `size-limit.json`).

## Snyk
- **Objaw:** job pada na braku tokenu.
- **Fix:** ustaw `SNYK_TOKEN` jako GitHub Secret. Brak secreta = step jest pomijany (ma warunek `if: secrets.SNYK_TOKEN != ''`).
