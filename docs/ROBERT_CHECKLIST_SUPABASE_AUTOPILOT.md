# ✅ CHECKLIST DLA ROBERTA - Supabase Deploy Autopilot Setup

> **Czas:** 10 minut (jednorazowo)
> **Poziom trudności:** 🟢 Łatwy (tylko klikanie w UI)
> **Po wykonaniu:** Deploy Supabase jednym kliknięciem! 🚀

---

## 📊 STATUS

**Branch:** `claude/setup-supabase-autopilot-AXdxk`
**Commit:** `873c1a6` - feat: add Supabase Deploy Autopilot workflow
**Build Status:** ✅ Passing (29.22s)
**Tests Status:** ✅ All 188 tests passed

**Nowe pliki:**
- ✅ `.github/workflows/supabase-deploy.yml` - Automatyczny workflow deploy
- ✅ `docs/SUPABASE_DEPLOY_GUIDE.md` - Szczegółowa instrukcja (dla Roberta)

---

## 🎯 CO TO ROBI?

Ten PR dodaje **workflow GitHub Actions**, który automatycznie:
1. Łączy się z Twoim projektem Supabase
2. Wgrywa wszystkie migracje bazy danych (19 plików `.sql`)
3. Deployuje wszystkie Edge Functions (16 funkcji)
4. Weryfikuje czy wszystko się udało (sprawdza 10 kluczowych tabel)
5. Raportuje wyniki

**Korzyści:**
- ❌ Koniec z ręcznym `supabase db push` w terminalu
- ❌ Koniec z deployowaniem funkcji po kolei
- ✅ **Jeden kliknięć** = cały deployment (po setupie)
- ✅ Automatyczna weryfikacja
- ✅ Szczegółowe logi

---

## 📋 CHECKLIST - RĘCZNE KROKI (10% MANUAL)

### KROK 1: Merge PR (GitHub UI)

**Gdzie:**
1. Otwórz: https://github.com/RobertB1978/majster-ai-oferty/pull/new/claude/setup-supabase-autopilot-AXdxk
2. Kliknij **"Create pull request"**
3. (Opcjonalnie) Przeczytaj diff (sprawdź co się zmienia)
4. Kliknij **"Merge pull request"** → **"Confirm merge"**
5. (Opcjonalnie) Usuń branch: **"Delete branch"**

**Screenshot ścieżki:**
```
GitHub → Pull Requests → New Pull Request → Create → Merge
```

---

### KROK 2: Wygeneruj Supabase Access Token

**Gdzie kliknąć:**
1. Otwórz: https://supabase.com/dashboard
2. Zaloguj się
3. Kliknij **swój avatar** (prawy górny róg) → **"Account Settings"**
4. Menu z lewej: **"Access Tokens"**
5. Kliknij **"Generate new token"**
6. Nazwa: `GitHub Actions Deploy` (lub dowolna)
7. Kliknij **"Generate token"**
8. **SKOPIUJ TOKEN** (wygląda: `sbp_abc123...xyz789`)
   - ⚠️ Token pojawi się tylko RAZ! Zapisz go teraz!

**Screenshot ścieżki:**
```
Supabase → Avatar → Account Settings → Access Tokens → Generate new token
```

**Co zapisać:**
```
SUPABASE_ACCESS_TOKEN: sbp_______________ (Twój token tutaj)
```

---

### KROK 3: Znajdź Project Reference ID

**Gdzie kliknąć:**
1. Wróć do dashboardu: https://supabase.com/dashboard
2. Otwórz swój projekt (`majster-ai`)
3. Kliknij **"Settings"** (⚙️ ikona na dole lewego menu)
4. Kliknij **"General"**
5. Znajdź pole **"Reference ID"**
6. Skopiuj wartość (np. `xwxvqhhnozfrjcjmcltv`)

**ALBO szybciej - z URL:**
```
https://supabase.com/dashboard/project/xwxvqhhnozfrjcjmcltv
                                        ^^^^^^^^^^^^^^^^^^^^
                                        TO JEST TWÓJ PROJECT_REF
```

**Screenshot ścieżki:**
```
Supabase → [Twój Projekt] → Settings → General → Reference ID
```

**Co zapisać:**
```
SUPABASE_PROJECT_REF: xwxvqhhnozfrjcjmcltv (lub Twoje ID)
```

---

### KROK 4: Dodaj GitHub Secrets

**Gdzie kliknąć:**
1. Otwórz: https://github.com/RobertB1978/majster-ai-oferty/settings/secrets/actions
2. Kliknij **"New repository secret"** (zielony przycisk, prawy górny róg)

**Secret #1:**
- **Name:** `SUPABASE_ACCESS_TOKEN`
- **Secret:** (wklej token z KROKU 2)
- Kliknij **"Add secret"**

**Secret #2:**
- Kliknij ponownie **"New repository secret"**
- **Name:** `SUPABASE_PROJECT_REF`
- **Secret:** (wklej project ref z KROKU 3, np. `xwxvqhhnozfrjcjmcltv`)
- Kliknij **"Add secret"**

**Screenshot ścieżki:**
```
GitHub Repo → Settings → Secrets and variables → Actions → New repository secret
```

**Weryfikacja:**
Po dodaniu powinieneś zobaczyć:
```
✅ SUPABASE_ACCESS_TOKEN    Updated now
✅ SUPABASE_PROJECT_REF     Updated now
```

---

### KROK 5: Uruchom Workflow (PIERWSZY DEPLOY!)

**Gdzie kliknąć:**
1. GitHub repo: https://github.com/RobertB1978/majster-ai-oferty
2. Kliknij zakładkę **"Actions"** (na górze)
3. Lewą kolumna: znajdź **"Supabase Deploy Autopilot"**
4. Kliknij na nazwę
5. Po prawej: przycisk **"Run workflow"** (niebieski dropdown)
6. Kliknij **"Run workflow"**
7. Zostaw domyślne: `environment: production`
8. Kliknij zielony **"Run workflow"** (w dropdownie)

**Screenshot ścieżki:**
```
GitHub → Actions → Supabase Deploy Autopilot → Run workflow → Run workflow
```

**Co się stanie:**
- Workflow uruchomi się (~2-5 minut)
- Automatycznie:
  1. Zainstaluje Supabase CLI
  2. Zaloguje się (używając tokenu)
  3. Połączy z projektem
  4. Wgra 19 migracji SQL
  5. Wdroży 16 Edge Functions
  6. Zweryfikuje deployment (sprawdzi 10 tabel)
  7. Pokaże raport

---

### KROK 6: Sprawdź Wyniki (Verification)

**6.1 Sprawdź GitHub Actions Logs**

**Gdzie:**
1. Zostań na stronie **Actions**
2. Kliknij na najnowszy workflow run
3. Kliknij na job: **"Deploy Migrations & Functions"**
4. Rozwiń kroki (kliknij na nazwy)

**Co sprawdzić:**
- ✅ Każdy krok ma zielony checkmark
- ✅ Ostatni krok pokazuje: **"🎉 Deployment completed successfully!"**
- ✅ Verification step: **"✅ All critical tables exist"**

**Screenshot ścieżki:**
```
GitHub → Actions → [Latest Run] → Deploy Migrations & Functions → [Expand steps]
```

---

**6.2 Sprawdź Supabase Dashboard - Tabele**

**Gdzie:**
1. Supabase Dashboard: https://supabase.com/dashboard
2. Otwórz swój projekt
3. Kliknij **"Table Editor"** (lewem menu)
4. Sprawdź czy widzisz tabele:
   - ✅ `profiles`
   - ✅ `organizations`
   - ✅ `clients`
   - ✅ `projects`
   - ✅ `quotes`
   - ✅ `offer_sends`
   - ✅ `offer_approvals`
   - ✅ `user_subscriptions`
   - ✅ `notifications`
   - ✅ `team_members`
   - ✅ (łącznie ~30 tabel)

**Screenshot ścieżki:**
```
Supabase → [Projekt] → Table Editor → [Lista tabel]
```

---

**6.3 Sprawdź Supabase Dashboard - Edge Functions**

**Gdzie:**
1. Supabase Dashboard (ten sam projekt)
2. Kliknij **"Edge Functions"** (lewe menu)
3. Sprawdź czy widzisz funkcje z **zielonymi checkmarkami**:
   - ✅ `ai-chat-agent`
   - ✅ `ai-quote-suggestions`
   - ✅ `analyze-photo`
   - ✅ `approve-offer`
   - ✅ `create-checkout-session`
   - ✅ `delete-user-account`
   - ✅ `finance-ai-analysis`
   - ✅ `healthcheck`
   - ✅ `ocr-invoice`
   - ✅ `public-api`
   - ✅ `send-offer-email`
   - ✅ `send-expiring-offer-reminders`
   - ✅ `stripe-webhook`
   - ✅ `voice-quote-processor`
   - ✅ (łącznie 16 funkcji)

**Screenshot ścieżki:**
```
Supabase → [Projekt] → Edge Functions → [Lista funkcji]
```

---

**6.4 Sprawdź Supabase Dashboard - Storage**

**Gdzie:**
1. Supabase Dashboard (ten sam projekt)
2. Kliknij **"Storage"** (lewe menu)
3. Sprawdź czy widzisz 3 buckety:
   - ✅ `logos` (public)
   - ✅ `project-photos` (private)
   - ✅ `company-documents` (private)

**Screenshot ścieżki:**
```
Supabase → [Projekt] → Storage → [Lista bucketów]
```

---

## ✅ FINALNA CHECKLIST (do zaznaczenia)

Zaznacz każdy punkt po wykonaniu:

### Setup (jednorazowo):
- [ ] **KROK 1:** Zmergeowałem PR `claude/setup-supabase-autopilot-AXdxk`
- [ ] **KROK 2:** Wygenerowałem Supabase Access Token
- [ ] **KROK 3:** Skopiowałem Project Reference ID
- [ ] **KROK 4:** Dodałem 2 GitHub Secrets (SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF)
- [ ] **KROK 5:** Uruchomiłem workflow "Run workflow"
- [ ] **KROK 6.1:** Workflow zakończył się sukcesem (✅ zielony checkmark)
- [ ] **KROK 6.2:** Widzę ~30 tabel w Supabase Table Editor
- [ ] **KROK 6.3:** Widzę 16 funkcji z zielonymi checkmarkami w Edge Functions
- [ ] **KROK 6.4:** Widzę 3 buckety w Storage

### Weryfikacja aplikacji:
- [ ] **Test 1:** Otworzyłem aplikację (localhost lub Vercel)
- [ ] **Test 2:** Mogę się zalogować
- [ ] **Test 3:** Dashboard się ładuje bez błędów
- [ ] **Test 4:** Mogę dodać nowego klienta
- [ ] **Test 5:** Mogę utworzyć projekt

---

## 🎉 PO WYKONANIU CHECKLISTY

**Gratulacje!** Supabase Deploy Autopilot jest gotowy! 🚀

### 🔄 Następne deploymenty (1 KLIKNIĘCIE):

**Gdy chcesz wdrożyć zmiany w przyszłości:**
1. Zmień kod (dodaj migrację lub edytuj funkcję)
2. Commit i push
3. GitHub → Actions → "Supabase Deploy Autopilot" → **"Run workflow"**
4. Poczekaj 2-5 minut ☕
5. ✅ Gotowe!

**To wszystko! Nie musisz już:**
- ❌ Logować się do Supabase CLI w terminalu
- ❌ Uruchamiać `supabase db push` ręcznie
- ❌ Deployować funkcji po kolei
- ❌ Sprawdzać czy wszystko działa

**Workflow robi to za Ciebie automatycznie!** 🎉

---

## 📚 Dodatkowe zasoby

- **Szczegółowa instrukcja:** `docs/SUPABASE_DEPLOY_GUIDE.md`
- **Troubleshooting:** `docs/SUPABASE_DEPLOY_GUIDE.md` (sekcja "Rozwiązywanie problemów")
- **Dokumentacja Supabase CLI:** https://supabase.com/docs/reference/cli
- **GitHub Actions Docs:** https://docs.github.com/en/actions

---

## 🆘 Problemy?

Jeśli coś nie działa:
1. Sprawdź logi workflow (GitHub Actions → [Twój run] → kliknij na czerwony krok)
2. Przeczytaj sekcję **"Rozwiązywanie problemów"** w `docs/SUPABASE_DEPLOY_GUIDE.md`
3. Jeśli dalej nie działa - stwórz GitHub Issue z opisem problemu i logami

---

## 📊 DIFF SUMMARY

**Pliki dodane:** 2
- `.github/workflows/supabase-deploy.yml` (222 linie)
- `docs/SUPABASE_DEPLOY_GUIDE.md` (408 linii)

**Pliki zmienione:** 0
**Pliki usunięte:** 0
**Łącznie linii:** +630

**Risk Level:** 🟢 LOW
- Tylko nowe pliki (workflow + dokumentacja)
- Zero zmian w istniejącym kodzie
- Workflow działa tylko ręcznie (workflow_dispatch)
- Wszystkie operacje są idempotentne (bezpieczne do powtarzania)

**Rollback:** Nie potrzebny
- Jeśli workflow nie działa - po prostu go nie uruchamiaj
- Jeśli chcesz usunąć - usuń plik `.github/workflows/supabase-deploy.yml`

---

**Powodzenia, Robert! 🚀**

**Pytania?** Sprawdź `docs/SUPABASE_DEPLOY_GUIDE.md` lub stwórz issue w repo.

---

**Autor:** Claude Code Autopilot
**Data:** 2025-12-18
**Branch:** `claude/setup-supabase-autopilot-AXdxk`
**Commit:** `873c1a6`
