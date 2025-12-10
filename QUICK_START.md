# 🚀 QUICK START - Majster.AI na Własnym Supabase

## TL;DR - 3 Komendy Do Uruchomienia

```bash
# 1. Setup Supabase (migracja + Edge Functions)
./setup-supabase.sh

# 2. Setup Vercel (manual - see setup-vercel-env.md)
cat setup-vercel-env.md

# 3. Setup Supabase Secrets (manual - see setup-supabase-secrets.md)
cat setup-supabase-secrets.md
```

---

## ⚡ CO ZROBIĘ AUTOMATYCZNIE

Skrypt `setup-supabase.sh` wykona automatycznie:

✅ Instalację Supabase CLI
✅ Logowanie do Supabase
✅ Połączenie z projektem (`xwxvqhhnozfrjcjmcltv`)
✅ Migrację bazy danych (32 tabele + RLS + functions + triggers)
✅ Deployment Edge Functions (14 funkcji)

**Czas: ~10-15 minut**

---

## ⚠️ CO MUSISZ ZROBIĆ RĘCZNIE

### 1. Vercel Environment Variables (5 minut)

Otwórz plik: `setup-vercel-env.md`

**Skrót:**
1. Vercel Dashboard → Twój projekt → Settings → Environment Variables
2. Dodaj: `VITE_SUPABASE_URL` = `https://xwxvqhhnozfrjcjmcltv.supabase.co`
3. Dodaj: `VITE_SUPABASE_ANON_KEY` = `eyJhbGci...` (z pliku .env)
4. Zaznacz wszystkie środowiska (Production + Preview + Development)
5. Redeploy

### 2. Supabase Secrets (10 minut)

Otwórz plik: `setup-supabase-secrets.md`

**Minimum do uruchomienia:**
- `RESEND_API_KEY` (https://resend.com)
- `GEMINI_API_KEY` (https://aistudio.google.com) - DARMOWY!

---

## 📋 PEŁNY FLOW - KROK PO KROKU

### Krok 1: Uruchom Automatyczny Setup
```bash
./setup-supabase.sh
```

**Co się stanie:**
- Zainstaluje Supabase CLI
- Poprosi Cię o zalogowanie (otworzy przeglądarkę)
- Zmigruje bazę danych
- Wdroży Edge Functions

**Oczekiwany output:**
```
✅ Supabase CLI installed
✅ Logged in to Supabase
✅ Project linked
✅ Database migrations completed
✅ Edge Functions deployed
```

### Krok 2: Konfiguruj Vercel
```bash
cat setup-vercel-env.md
```

Postępuj zgodnie z instrukcjami w pliku.

### Krok 3: Konfiguruj Supabase Secrets
```bash
cat setup-supabase-secrets.md
```

Postępuj zgodnie z instrukcjami w pliku.

### Krok 4: Test
Wejdź na URL Vercel i przetestuj:
- Rejestracja
- Logowanie
- Dodaj klienta
- Utwórz projekt
- Wygeneruj wycenę

---

## 🆘 PROBLEMY?

### Błąd: "Supabase CLI not found"
```bash
npm install -g supabase
```

### Błąd: "Authentication required"
```bash
supabase login
```

### Błąd: "Migration failed"
**Manual fallback:**
1. Otwórz: https://supabase.com/dashboard/project/xwxvqhhnozfrjcjmcltv/sql/new
2. Skopiuj cały plik: `CONSOLIDATED_MIGRATIONS.sql`
3. Wklej i kliknij "Run"

### Błąd: "Edge Functions deployment failed"
**Manual fallback:**
```bash
supabase functions deploy ai-chat-agent
supabase functions deploy send-offer-email
# ... repeat for each function
```

---

## ✅ CHECKLIST WERYFIKACJI

Po zakończeniu wszystkich kroków:

- [ ] ✅ Supabase: Table Editor pokazuje ~30 tabel
- [ ] ✅ Supabase: Edge Functions pokazuje 14 funkcji
- [ ] ✅ Supabase: Secrets ma 4-5 wpisów
- [ ] ✅ Vercel: Environment Variables ma 2 wpisy
- [ ] ✅ Vercel: Ostatni deployment zakończył się sukcesem
- [ ] ✅ Aplikacja ładuje się (bez białego ekranu)
- [ ] ✅ Mogę się zarejestrować i zalogować
- [ ] ✅ Mogę dodać klienta i projekt

---

## 📊 CZAS POTRZEBNY

| Krok | Czas | Typ |
|------|------|-----|
| 1. Setup Supabase (auto) | 10-15 min | Automatyczny |
| 2. Vercel env vars | 5 min | Ręczny |
| 3. Supabase secrets | 10 min | Ręczny |
| 4. Test | 10 min | Ręczny |
| **TOTAL** | **35-40 min** | Mix |

---

## 🎯 NASTĘPNE KROKI

Po uruchomieniu:

1. **Backup bazy:** Supabase → Settings → Database → Backups
2. **Custom domain:** Vercel → Settings → Domains
3. **Monitoring:** Supabase → Logs + Vercel → Analytics
4. **Team members:** Aplikacja → Settings → Team

---

**POWODZENIA!** 🚀

Jeśli masz pytania lub problemy - daj znać!
