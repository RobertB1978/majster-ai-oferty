# P0 Raport: Regresja auth/host po kaskadzie fixow #478-#484

Data: 2026-03-23

## Status: KOD JEST POPRAWNY - WYMAGA REDEPLOY

## 1. Objaw

| Objaw | Opis |
|-------|------|
| Redirect loop na custom domain | `www.majsterai.com -> majsterai.com` w vercel.json kolidowal z Vercel Domains |
| Host/runtime error na vercel.app | HostMismatchBanner diagnostyczny (nie blokujacy) |
| Splash freeze | Lazy ConfigProvider/DraftProvider BEZ Suspense (naprawione w #481) |
| Race condition login | navigate() przed onAuthStateChange (naprawione w #482) |

## 2. Lancuch commitow (fix-on-fix cascade)

| Commit | PR | Efekt | Status |
|--------|----|----|--------|
| `80787e8` | #480 | **ROOT CAUSE**: lazy providers bez Suspense | Naprawiony #481 |
| `ad110d3` | #479 | Router v7 flags, i18n audit | OK |
| `a6c8283` | #478 | isMounted guard, ProtectedRoute spinner | OK |
| `25ae17f` | #481 | Fix #480: un-lazy providers, Suspense | NAPRAWCZY |
| `d9cc9cf` | #482 | Fix race condition, splash-guard, client.ts no-throw | NAPRAWCZY |
| `b96294e` | #483 | **ESKALACJA**: redirect loop w vercel.json | Problem |
| `260c561` | #484 | Usuniecie redirect z vercel.json | NAPRAWCZY |

## 3. Root cause

Kaskada fix-on-fix: #480 zlamal app -> #481 naprawil -> #482 naprawil auth ->
#483 dodal redirect loop w vercel.json -> #484 usunal redirect.

**Net diff vercel.json od #476 do #484 = ZERO** (redirect dodany i usuniety).

## 4. Obecny stan kodu (#484)

- Build: PASS
- Testy auth/host/splash: 34/34 PASS
- Brak hard redirectow w kodzie auth
- HostMismatchBanner: informacyjny banner, nie redirect
- AuthContext: poprawny timeout, network error, race condition fix
- client.ts: logger.error zamiast throw (bezpieczne)

## 5. Dlaczego produkcja moze nie dzialac

Jesli Vercel deployment z commitu `b96294e` (#483, z redirect loop) jest nadal aktywny
jako produkcyjny, to przegladadrka cache'uje permanent redirect (301) i pokazuje
ERR_TOO_MANY_REDIRECTS.

## 6. Rollback plan

### Opcja A (ZALECANA): Redeploy #484

1. Vercel Dashboard -> Deployments -> `260c561`
2. Kliknij "Redeploy" (wymusza nowy build)
3. Weryfikacja:
   - `curl -sI https://www.majsterai.com` -> 301 na majsterai.com (z Vercel Domains)
   - `curl -sI https://majsterai.com` -> 200
   - `curl -sI https://majsterai.com/app/dashboard` -> 200 (SPA rewrite)

### Opcja B (FALLBACK): Rollback do #476

Commit: `0501f76` (22 marca, 18:36)
W Vercel: Deployments -> #476 -> "Promote to Production"

Ryzyko: throw w client.ts wraca (jesli config Supabase niepoprawny = splash freeze)

## 7. Test plan (po deploy)

### Testy manualne

1. [ ] Otworz https://majsterai.com/ - landing page sie laduje
2. [ ] Otworz https://www.majsterai.com/ - redirect na majsterai.com (bez petli)
3. [ ] Otworz https://majster-ai-oferty.vercel.app/ - laduje sie z bannerem hosta
4. [ ] Kliknij "Zaloguj sie" -> formularz logowania
5. [ ] Zaloguj sie prawidlowym kontem -> przekierowanie na /app/dashboard
6. [ ] Odswierz strone na /app/dashboard -> pozostaje zalogowany
7. [ ] Wyloguj sie -> przekierowanie na /login
8. [ ] Otworz /app/dashboard bez logowania -> redirect na /login

### Testy regresji (automatyczne)

```bash
npx vitest run src/test/features/auth-access.test.tsx
npx vitest run src/test/features/host-redirect-loop.test.ts
npx vitest run src/test/features/splash-guard.test.ts
```

## 8. Pliki zmienione w kaskadzie (scope fence)

| Plik | Zmiany | Bezpieczny? |
|------|--------|-------------|
| vercel.json | redirect dodany i usuniety (net zero) | TAK |
| src/App.tsx | lazy imports, Suspense, HostMismatchBanner, v7 flags | TAK |
| src/contexts/AuthContext.tsx | timeout, resolvedRef, host detection | TAK |
| src/components/auth/ProtectedRoute.tsx | error states, slow hint | TAK |
| src/integrations/supabase/client.ts | throw -> logger.error | TAK |
| public/splash-guard.js | NOWY - progressive feedback | TAK |
| index.html | script tag splash-guard.js | TAK |
| src/components/layout/AppLayout.tsx | usuniecie isLoading duplikacji | TAK |
| src/components/layout/NewShellLayout.tsx | usuniecie isLoading duplikacji | TAK |
| src/pages/Login.tsx | usuniecie navigate z handleSubmit | TAK |

## 9. Wniosek

Kod po #484 jest poprawny. Problem produkcyjny najprawdopodobniej wynika z:
1. Zcache'owanego deploymentu z #483 (redirect loop)
2. Przegladarki cache'ujace 301 permanent redirect

**Akcja:** Redeploy #484 + instrukcja dla uzytkownikow: wyczysc cache przegladarki
lub otworz w trybie incognito.
