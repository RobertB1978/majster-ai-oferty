# 🚀 Supabase Deploy Autopilot - Przewodnik dla Laika

> **Dla kogo:** Ten przewodnik jest dla Roberta i każdego, kto chce wdrożyć zmiany w Supabase **jednym kliknięciem** zamiast ręcznego kopiowania SQL i deployowania funkcji.

---

## 🎯 Co to robi?

**Supabase Deploy Autopilot** to automatyczny workflow w GitHub Actions, który:
1. ✅ Łączy się z Twoim projektem Supabase
2. ✅ Wgrywa wszystkie migracje bazy danych (pliki `.sql`)
3. ✅ Deployuje wszystkie Edge Functions (16 funkcji AI, email, OCR, etc.)
4. ✅ Weryfikuje czy wszystko się udało (sprawdza kluczowe tabele)
5. ✅ Raportuje wyniki

**Czas:** ~2-5 minut (w pełni automatycznie)
**Kliknięcia:** 5 kliknięć (jednorazowa konfiguracja) → potem tylko 1 kliknięcie per deploy

---

## 📋 KROK PO KROKU (10 minut setup, raz na zawsze)

### 🔐 KROK 1: Wygeneruj Supabase Access Token

**Gdzie kliknąć:**

1. Otwórz: https://supabase.com/dashboard
2. Zaloguj się na swoje konto
3. Kliknij **swój avatar/ikonę** w prawym górnym rogu
4. Wybierz **"Account Settings"**
5. W menu z lewej strony kliknij **"Access Tokens"**
6. Kliknij przycisk **"Generate new token"**
7. Podaj nazwę tokena (np. `GitHub Actions Deploy`)
8. Kliknij **"Generate token"**
9. **SKOPIUJ TOKEN** (wygląda jak: `sbp_abc123...xyz789`)
   - ⚠️ **WAŻNE:** Token pojawi się tylko RAZ! Skopiuj go teraz i zapisz w bezpiecznym miejscu.

**Screenshot ścieżki:**
```
Supabase Dashboard → Avatar (prawy górny róg) → Account Settings → Access Tokens → Generate new token
```

**Co zapisać:**
```
SUPABASE_ACCESS_TOKEN: sbp_abc123def456ghi789...
```

---

### 🆔 KROK 2: Znajdź swój Project Reference ID

**Gdzie kliknąć:**

1. Wróć do głównego dashboardu: https://supabase.com/dashboard
2. Otwórz swój projekt (`majster-ai` lub inna nazwa)
3. Kliknij **"Settings"** (ikona ⚙️ na dole lewego menu)
4. Kliknij **"General"**
5. W sekcji **"General settings"** znajdź pole **"Reference ID"**
6. Skopiuj wartość (np. `zpawgcecwqvypodzvlzy`)

**Alternatywna metoda (z URL):**
- Otwórz swój projekt w Supabase
- Spójrz na URL w pasku przeglądarki:
  ```
  https://supabase.com/dashboard/project/zpawgcecwqvypodzvlzy
                                        ^^^^^^^^^^^^^^^^^^^^
                                        TO JEST TWÓJ PROJECT_REF
  ```

**Screenshot ścieżki:**
```
Supabase Dashboard → [Twój Projekt] → Settings → General → Reference ID
```

**Co zapisać:**
```
SUPABASE_PROJECT_REF: zpawgcecwqvypodzvlzy
```

---

### 🔑 KROK 3: Dodaj Secrets do GitHub

**Gdzie kliknąć:**

1. Otwórz: https://github.com/RobertB1978/majster-ai-oferty
2. Kliknij zakładkę **"Settings"** (na górze, obok "Code", "Issues", etc.)
3. W menu z lewej strony znajdź **"Secrets and variables"**
4. Kliknij **"Actions"** (pod "Secrets and variables")
5. Kliknij zielony przycisk **"New repository secret"** (prawy górny róg)

**Dodaj PIERWSZY secret:**
- **Name:** `SUPABASE_ACCESS_TOKEN`
- **Secret:** `sbp_abc123...` (token z KROKU 1)
- Kliknij **"Add secret"**

**Dodaj DRUGI secret:**
- Kliknij ponownie **"New repository secret"**
- **Name:** `SUPABASE_PROJECT_REF`
- **Secret:** `zpawgcecwqvypodzvlzy` (project ref z KROKU 2)
- Kliknij **"Add secret"**

**Screenshot ścieżki:**
```
GitHub Repo → Settings → Secrets and variables → Actions → New repository secret
```

**Weryfikacja:**
Po dodaniu powinieneś zobaczyć 2 sekrety:
```
✅ SUPABASE_ACCESS_TOKEN    Updated now
✅ SUPABASE_PROJECT_REF     Updated now
```

---

### 🎬 KROK 4: Uruchom Workflow (DEPLOY!)

**Gdzie kliknąć:**

1. W GitHub repo kliknij zakładkę **"Actions"** (na górze)
2. W lewej kolumnie znajdź workflow **"Supabase Deploy Autopilot"**
3. Kliknij na nazwę workflow
4. Po prawej stronie zobaczysz przycisk **"Run workflow"** (niebieski dropdown)
5. Kliknij **"Run workflow"**
6. Zostaw domyślne ustawienia:
   - `environment: production`
7. Kliknij zielony przycisk **"Run workflow"** (w dropdownie)

**Screenshot ścieżki:**
```
GitHub Repo → Actions → Supabase Deploy Autopilot → Run workflow (dropdown) → Run workflow (przycisk)
```

**Co się stanie:**
- Workflow automatycznie:
  1. Zainstaluje Supabase CLI
  2. Zaloguje się do Supabase (używając tokenu)
  3. Połączy się z Twoim projektem
  4. Wgra migracje SQL (wszystkie pliki z `supabase/migrations/`)
  5. Wdroży Edge Functions (wszystkie 16 funkcji)
  6. Zweryfikuje deployment (sprawdzi czy tabele istnieją)
  7. Pokaże raport

**Czas trwania:** ~2-5 minut

---

### ✅ KROK 5: Sprawdź wyniki

**Gdzie kliknąć:**

1. Pozostań na stronie **Actions**
2. Zobaczysz listę uruchomionych workflow (odśwież stronę jeśli trzeba)
3. Kliknij na najnowszy workflow run (**"Supabase Deploy Autopilot"**)
4. Kliknij na job **"Deploy Migrations & Functions"**
5. Zobacz logi każdego kroku (rozwiń klikając na nazwę)

**Co sprawdzić w logach:**

**✅ SUKCES - zobaczysz:**
```
✅ Database migrations applied successfully
✅ All Edge Functions deployed successfully
✅ All critical tables exist
🎉 VERIFICATION PASSED!
🎉 Deployment completed successfully!
```

**❌ BŁĄD - zobaczysz:**
```
❌ ERROR: SUPABASE_ACCESS_TOKEN is not set!
❌ ERROR: No supabase/config.toml found
❌ VERIFICATION FAILED: X critical table(s) missing
```

**Screenshot ścieżki:**
```
GitHub Repo → Actions → [Latest Workflow Run] → Deploy Migrations & Functions → [Expand steps]
```

---

### 🔍 KROK 6: Weryfikacja w Supabase Dashboard

**Sprawdź czy wszystko się wdrożyło:**

#### 6.1 Sprawdź tabele

1. Otwórz: https://supabase.com/dashboard
2. Wybierz swój projekt
3. Kliknij **"Table Editor"** (ikona tabeli w lewym menu)
4. Sprawdź czy widzisz kluczowe tabele:
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
   - ✅ (i inne... łącznie ~30 tabel)

**Screenshot ścieżki:**
```
Supabase Dashboard → [Twój Projekt] → Table Editor → [Lista tabel]
```

#### 6.2 Sprawdź Storage Buckets

1. W Supabase Dashboard kliknij **"Storage"** (w lewym menu)
2. Sprawdź czy widzisz 3 buckety:
   - ✅ `logos` (public)
   - ✅ `project-photos` (private)
   - ✅ `company-documents` (private)

**Screenshot ścieżki:**
```
Supabase Dashboard → [Twój Projekt] → Storage → [Lista bucketów]
```

#### 6.3 Sprawdź Edge Functions

1. W Supabase Dashboard kliknij **"Edge Functions"** (w lewym menu)
2. Sprawdź czy widzisz funkcje z zielonymi checkmarkami (deployed):
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
   - ✅ (i inne... łącznie 16 funkcji)

**Screenshot ścieżki:**
```
Supabase Dashboard → [Twój Projekt] → Edge Functions → [Lista funkcji]
```

3. (Opcjonalnie) Kliknij zakładkę **"Logs"** żeby sprawdzić czy nie ma błędów

---

## 🎉 GOTOWE! Co dalej?

### ✅ CHECKLIST KOŃCOWA

Po wykonaniu powyższych kroków zaznacz:

- [ ] **Krok 1:** Wygenerowałem Supabase Access Token
- [ ] **Krok 2:** Skopiowałem Project Reference ID
- [ ] **Krok 3:** Dodałem oba sekrety do GitHub (SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF)
- [ ] **Krok 4:** Uruchomiłem workflow "Run workflow"
- [ ] **Krok 5:** Workflow zakończył się sukcesem (zielony checkmark ✅)
- [ ] **Krok 6.1:** Widzę tabele w Supabase Table Editor
- [ ] **Krok 6.2:** Widzę 3 buckety w Supabase Storage
- [ ] **Krok 6.3:** Widzę Edge Functions z zielonymi checkmarkami

### 🔄 NASTĘPNE DEPLOYMENTY (1 KLIKNIĘCIE!)

**Gdy chcesz wdrożyć zmiany w przyszłości:**

1. Zmień kod (dodaj migrację SQL lub edytuj funkcję)
2. Zrób commit i push do brancha
3. Przejdź do **GitHub Actions**
4. Kliknij **"Supabase Deploy Autopilot"**
5. Kliknij **"Run workflow"** → **"Run workflow"**
6. Poczekaj 2-5 minut ☕
7. Gotowe! ✅

**To wszystko!** Nie musisz już ręcznie:
- ❌ Logować się do Supabase CLI
- ❌ Uruchamiać `supabase db push`
- ❌ Deployować funkcji po kolei
- ❌ Sprawdzać czy wszystko działa

Workflow zrobi to za Ciebie automatycznie! 🎉

---

## 🆘 Rozwiązywanie problemów

### Problem 1: "SUPABASE_ACCESS_TOKEN is not set"

**Rozwiązanie:**
1. Sprawdź czy dodałeś secret w GitHub:
   - GitHub → Settings → Secrets and variables → Actions
2. Sprawdź czy nazwa secretu to DOKŁADNIE: `SUPABASE_ACCESS_TOKEN` (wielkie litery!)
3. Sprawdź czy token jest ważny (wygeneruj nowy jeśli minęło dużo czasu)

---

### Problem 2: "VERIFICATION FAILED: X critical table(s) missing"

**Rozwiązanie:**
1. Sprawdź logi kroku **"Push database migrations"**
2. Szukaj błędów SQL (czerwone napisy)
3. Możliwe przyczyny:
   - Migracja SQL ma błąd składni
   - Tabela już istnieje (konflikt)
   - Brak uprawnień

**Jak naprawić:**
- Jeśli tabele JUŻ ISTNIEJĄ: ignoruj błąd (workflow sprawdza czy tabele są, nie czy migracja się udała)
- Jeśli to nowy projekt: sprawdź pliki w `supabase/migrations/` pod kątem błędów SQL

---

### Problem 3: "Login failed" lub "Invalid token"

**Rozwiązanie:**
1. Wygeneruj NOWY token w Supabase:
   - Supabase Dashboard → Avatar → Account Settings → Access Tokens → Generate new token
2. Zaktualizuj secret w GitHub:
   - GitHub → Settings → Secrets and variables → Actions → SUPABASE_ACCESS_TOKEN → Edit
3. Uruchom workflow ponownie

---

### Problem 4: "Function deployment failed: xyz"

**Rozwiązanie:**
1. Sprawdź logi funkcji która failuje
2. Sprawdź czy funkcja ma plik `index.ts`:
   - `supabase/functions/[nazwa-funkcji]/index.ts`
3. Sprawdź czy funkcja nie ma błędów składni TypeScript
4. Sprawdź Supabase Dashboard → Edge Functions → [Funkcja] → Logs

**Jak naprawić:**
- Napraw kod funkcji
- Zrób commit i push
- Uruchom workflow ponownie

---

### Problem 5: Workflow jest żółty/pending przez długi czas

**Rozwiązanie:**
1. Kliknij na workflow run
2. Kliknij **"Cancel workflow"** (jeśli czeka >10 minut)
3. Uruchom workflow ponownie
4. Jeśli problem się powtarza:
   - Sprawdź czy GitHub Actions mają wolne runnery (może być queue)
   - Spróbuj za 5-10 minut

---

## 📚 Dodatkowe zasoby

### Powiązane dokumenty w repo:

- **`SUPABASE_SETUP_GUIDE.md`** - Ręczna konfiguracja Supabase (jeśli workflow nie działa)
- **`SUPABASE_SETUP_CHECKLIST.md`** - Checklist konfiguracji Auth
- **`EXPORT_TO_OWN_SUPABASE.md`** - Pełna migracja do nowego projektu Supabase

### Oficjalna dokumentacja:

- [Supabase CLI Docs](https://supabase.com/docs/reference/cli)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## 📞 Wsparcie

Jeśli masz problemy:

1. **Sprawdź logi workflow:**
   - GitHub → Actions → [Twój run] → [Kliknij na failed step]
   - Skopiuj treść błędu

2. **Sprawdź Supabase Dashboard:**
   - Edge Functions → Logs
   - SQL Editor → Run `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`

3. **GitHub Issues:**
   - Utwórz issue w repo z opisem problemu i logami
   - Tag: `deployment`, `supabase`

---

**Autor:** Claude Code Autopilot
**Wersja:** 1.0
**Data:** 2025-12-18
**Repo:** https://github.com/RobertB1978/majster-ai-oferty

---

**💡 TIP:** Zapisz ten przewodnik w zakładkach! Będziesz go używać za każdym razem gdy chcesz wdrożyć zmiany do Supabase.
