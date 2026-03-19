# Release Runbook — Majster.AI

**Wersja**: 1.0
**Ostatnia aktualizacja**: 2026-03-19
**Cel**: Procedury operacyjne dla release, hotfix i rollback. Nie zastępuje Launch Checklist — używaj obu.

---

## 1. Normalny release (feature branch → main)

### Krok 1: Pre-merge na branch

```bash
# Lokalnie przed otwarciem PR:
npm ci
npm run type-check           # musi exit 0
npm run lint                 # musi exit 0 (0 errors)
npm test -- --run --coverage # musi: wszystkie testy zielone + thresholdy OK
npm run build                # musi: bez błędów
```

### Krok 2: Otwórz PR do main

- Tytuł: `<type>: <opis>` (feat/fix/chore/docs/refactor)
- Opis: Co zmieniono, jak testować, screenshots jeśli UI
- Sprawdź: CI zielone (A1–A10 z LAUNCH_CHECKLIST.md)

### Krok 3: Po merge do main

1. Obserwuj GitHub Actions → `deployment-truth.yml` (Supabase deploy)
2. Obserwuj Vercel dashboard → deployment status
3. Po zakończeniu deploymentu wykonaj Smoke Test (sekcja C z LAUNCH_CHECKLIST.md)
4. Sprawdź `/version.json` na produkcji — czy `commitSha` zgadza się z merge commitem

### Krok 4: Weryfikacja post-deploy

```bash
# Sprawdź wersję na produkcji:
curl https://[twoja-domena]/version.json | jq .

# Sprawdź logi Edge Functions (wymaga Supabase CLI):
supabase functions logs --project-ref [PROJECT_REF] --tail
```

---

## 2. Hotfix (krytyczny bug na produkcji)

### Kiedy stosować
- P0 bug: aplikacja nie ładuje się, auth nie działa, dane nie zapisują się
- Czas reakcji: < 2h

### Procedura

```bash
# 1. Utwórz branch hotfix z main (nie z feature branch!)
git checkout main
git pull origin main
git checkout -b claude/hotfix-<opis>-<session-id>

# 2. Wprowadź minimalne zmiany (tylko fix, bez refactoringu)
# 3. Uruchom testy lokalnie
npm test -- --run
npm run type-check

# 4. Otwórz PR do main z prefixem "fix:" i oznaczeniem [HOTFIX]
# 5. Po merge: weryfikacja C1-C10 z LAUNCH_CHECKLIST.md

# 6. Jeśli fix nie jest możliwy < 30 min → rollback
```

---

## 3. Rollback

### Rollback Vercel (frontend)

```bash
# Opcja A: przez Vercel Dashboard
# Vercel → Deployments → znajdź poprzedni deployment → "Promote to Production"

# Opcja B: przez CLI
vercel rollback [deployment-url] --token $VERCEL_TOKEN
```

### Rollback Supabase migrations

> ⚠️ **UWAGA**: Supabase migrations są addytywne — nie można ich automatycznie cofnąć.
> Jeśli migration psuje dane, wymagana jest NOWA migracja naprawcza.

```bash
# NIGDY nie uruchamiaj bez potwierdzenia właściciela projektu:
# 1. Napisz nową migrację naprawczą
# 2. Przetestuj lokalnie: npx supabase db reset
# 3. Deploy naprawczej migracji przez supabase-deploy.yml

# Sprawdź stan migracji:
supabase migration list --project-ref [PROJECT_REF]
```

### Rollback Edge Functions

```bash
# Edge Functions są stateless — można re-deploy poprzedniej wersji przez CI
# Wystarczy przywrócić poprzedni commit i uruchomić deployment-truth.yml
git revert <commit-hash>
git push origin main
# CI automatycznie wykona deploy Edge Functions
```

---

## 4. Weryfikacja post-deploy (szczegółowa)

### 4.1 Sprawdź czy backend działa

```bash
# Supabase Reality Check (automatyczny po deploy przez CI):
# Zobacz artifacts w GitHub Actions → deployment-truth.yml → reality-report.md

# Manualnie:
curl https://[SUPABASE_URL]/rest/v1/ \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]"
# Powinien zwrócić listę dostępnych tabel (JSON)
```

### 4.2 Sprawdź Edge Functions

```bash
# Test send-offer-email (wymaga danych testowych):
curl -X POST https://[SUPABASE_URL]/functions/v1/send-offer-email \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
# Powinien zwrócić 400 (brak wymaganych danych) a nie 500 (crash)

# Sprawdź logi:
supabase functions logs send-offer-email --project-ref [PROJECT_REF]
```

### 4.3 Sprawdź wersję buildu

```bash
curl https://[twoja-domena]/version.json
# Przykładowy output:
# {
#   "appVersion": "0.1.0-alpha",
#   "commitSha": "abc1234",
#   "buildTimestamp": "2026-03-19T10:00:00.000Z",
#   "environment": "production"
# }
```

---

## 5. Monitoring — gdzie patrzeć

| Co | Gdzie | Jak |
|----|-------|-----|
| Frontend errors | Sentry (jeśli skonfigurowany) | `VITE_SENTRY_DSN` w Vercel |
| Edge Function logs | Supabase Dashboard → Functions → Logs | Filtry: `[send-offer-email]`, `[approve-offer]` |
| Build deployments | Vercel Dashboard → Deployments | Status, czas, logi |
| CI/CD status | GitHub Actions | `.github/workflows/*.yml` |
| Database health | Supabase Dashboard → Database | Query performance, connections |
| Bundle size | GitHub Actions → `bundle-analysis.yml` artifacts | `dist/stats.html` |

---

## 6. Kontakty i eskalacja

| Sytuacja | Działanie |
|----------|-----------|
| CI failed na main | Nie deploy. Fix na branch, nowy PR |
| Vercel deploy failed | Sprawdź build logs → fix → re-trigger |
| Supabase migration failed | **STOP** → informuj właściciela → napisz migration naprawczą |
| Edge Function crash (500) | Sprawdź logi → fix na branch → PR → deploy |
| Dane użytkowników utracone | **EMERGENCY** → Supabase → Point-in-time recovery (płatny plan) |

---

## 7. Checklista gotowości CI (quick reference)

Przed każdym merge sprawdź lokalnie:

```bash
# Cały pre-merge check w jednej linii:
npm run type-check && npm run lint && npm test -- --run && npm run build && echo "✅ ALL PASS"
```

Jeśli komenda zwróci `✅ ALL PASS` — PR jest gotowy do merge (pod warunkiem że CI jest zielone).

---

*Patrz też: `docs/LAUNCH_CHECKLIST.md` — kompletna lista launch gate.*
*Patrz też: `docs/mvp-gate/STATUS.md` — aktualny status MVP gate.*
*Patrz też: `docs/ops/REALITY_CHECK_RUNBOOK.md` — weryfikacja schematu bazy danych.*
