# DEPLOYMENT_TRUTH.md

## STATUS GLOBALNY: **UNRESOLVED**

- Evidence pack: [docs/P0_EVIDENCE_PACK.md](./P0_EVIDENCE_PACK.md)
- Request do zebrania dowodów: [docs/P0_EVIDENCE_REQUEST.md](./P0_EVIDENCE_REQUEST.md)

## Jak zebrać dowody w 10 minut (dla laika)
1. Wejdź do **Vercel → Project → Settings → Git** i zrób screenshot repo + production branch.
2. Wejdź do **Vercel → Deployments**, otwórz ostatni production deploy i zapisz screenshot z SHA + timestamp.
3. W tym deployu otwórz logi builda i skopiuj fragment kończący się sukcesem.
4. Wejdź do **Vercel → Settings → Environment Variables** i potwierdź `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (Production + Preview).
5. Wejdź do **Supabase → Settings → General**, zrób screenshot `project_id`.
6. Uruchom migracje-check (CLI albo panel), zapisz wynik applied migrations.
7. Wejdź do **Supabase → Edge Functions**, zrób screenshot listy funkcji i sekcji Secrets (same nazwy).
8. Otwórz logi 1–2 funkcji i zapisz brak błędów krytycznych.
9. Wklej całość do `docs/P0_EVIDENCE_PACK.md`.
10. Ustaw finalny wynik sekcji: **PASS** albo **FAIL** + wpisz Blockers (jeśli są).

---

Cel: jedno miejsce, które odpowiada na pytanie „co **naprawdę** działa na środowisku”.
Wynik każdej sekcji: **PASS / FAIL / BLOCKED** + dowody.

## 1) Vercel — checklista prawdy wdrożeniowej
### 1.1 Git integration
- [ ] Repo i branch produkcyjny są jednoznacznie wskazane.
- [ ] Auto-deploy z `main` jest potwierdzony.
- [ ] Preview deploy dla PR działa i ma unikalny URL.

### 1.2 Environment variables
- [ ] `VITE_SUPABASE_URL` ustawione dla Production + Preview.
- [ ] `VITE_SUPABASE_ANON_KEY` ustawione dla Production + Preview.
- [ ] Brak placeholderów, brak konfliktów nazw.

### 1.3 Build logs i artefakty
- [ ] Ostatni produkcyjny build zakończony sukcesem.
- [ ] W logu jest użyta oczekiwana wersja Node/npm.
- [ ] Nie ma błędów krytycznych (lint/test/build).

### 1.4 Rewrites/headers
- [ ] Rewrite SPA (`/(.*)` -> `/index.html`) działa.
- [ ] Trasa `/offer/*` renderuje się poprawnie.
- [ ] Nagłówki bezpieczeństwa i CSP są spójne z wymaganiami biznesowymi.

**Wynik Vercel:** `PASS | FAIL | BLOCKED`
**Blockers:** (wypisz)

---

## 2) Supabase — checklista prawdy wdrożeniowej
### 2.1 Migracje
- [ ] Lista migracji w repo = lista migracji zastosowanych na środowisku.
- [ ] Brak „driftu” (migracja w DB bez pliku lub plik bez wdrożenia).
- [ ] Ostatnia migracja jest znana i zweryfikowana.

### 2.2 Tabele i relacje
- [ ] Kluczowe tabele istnieją i mają zgodny schemat.
- [ ] Indeksy krytyczne są obecne.
- [ ] Brak niespójności typów kolumn między środowiskami.

### 2.3 RLS
- [ ] RLS włączone na tabelach wielodostępowych.
- [ ] Policy dla odczytu/zapisu jest udokumentowana.
- [ ] Testy „admin vs non-admin” dają oczekiwany wynik.

### 2.4 Edge Functions
- [ ] Lista funkcji w repo = lista funkcji wdrożonych.
- [ ] Wymagane sekrety są ustawione.
- [ ] Ostatnie wywołania nie pokazują błędów krytycznych.

**Wynik Supabase:** `PASS | FAIL | BLOCKED`
**Blockers:** (wypisz)

---

## 3) DOWODY (co wkleić obowiązkowo)
Dla każdej checklisty dołącz:
1. **Screeny** z paneli (Vercel/Supabase) z datą i środowiskiem.
2. **Logi build/deploy** (fragmenty z timestamp).
3. **Komendy i output** (np. porównanie list migracji).
4. **URL artefaktu** (preview/production) + krótki test manualny.

Format dowodu:
- `Źródło:` (panel/log/CLI)
- `Data:`
- `Środowisko:` (prod/preview/dev)
- `Wynik:` (PASS/FAIL)
- `Komentarz:`
