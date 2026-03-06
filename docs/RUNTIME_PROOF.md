# Runtime deployment truth proof

Minimalny punkt prawdy runtime jest dostępny pod adresem:

- `GET /version.json`

Plik jest generowany podczas buildu Vite i zawiera wyłącznie bezpieczne metadane diagnostyczne:

- `appVersion` — wersja aplikacji z `package.json`
- `commitSha` — skrócony SHA commita (7 znaków)
- `buildTimestamp` — znacznik czasu UTC buildu
- `supabaseHost` — sam hostname z `VITE_SUPABASE_URL`
- `supabaseProjectRefMasked` — zamaskowany ref projektu (bez pełnej wartości)
- `environment` — etykieta środowiska (`VERCEL_ENV`/`NODE_ENV`)

## Weryfikacja po deployu (produkcja)

1. Otwórz `https://<twoja-domena>/version.json`.
2. Potwierdź, że `commitSha` odpowiada deploymentowi na Vercel.
3. Potwierdź, że `supabaseHost` wskazuje oczekiwany backend Supabase.
4. Potwierdź, że w payloadzie **nie** ma żadnych kluczy/anon tokenów/secrets.

## Scope bezpieczeństwa

Ten mechanizm **nie** publikuje:

- `VITE_SUPABASE_ANON_KEY`
- żadnych tokenów JWT
- żadnych secretów runtime
