# 🚀 Deployment Quick Start - Majster.AI

**Czas: 30 minut** | **Poziom: Podstawowy**

Ten dokument prowadzi krok po kroku przez deployment aplikacji Majster.AI na Vercel z Supabase jako backend.

---

## ✅ Przed Rozpoczęciem

Musisz mieć:
- [ ] Konto GitHub (repo sklonowane)
- [ ] Konto Vercel (darmowy plan OK)
- [ ] Projekt Supabase (darmowy tier OK)
- [ ] Konto Resend.com (dla emaili, darmowy tier OK)

---

## 📝 KROK 1: Vercel Setup (5 minut)

### 1.1 Połącz repo z Vercel

```bash
1. Idź na: https://vercel.com/new
2. Wybierz: "Import Git Repository"
3. Wskaż: twoje repo (RobertB1978/majster-ai-oferty)
4. Kliknij: "Import"
```

### 1.2 Konfiguracja build

Vercel **automatycznie wykryje** ustawienia z `vercel.json`:
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

**Nie zmieniaj niczego** - kliknij "Deploy" (ale jeszcze nie teraz!)

---

## 🔐 KROK 2: Environment Variables (10 minut)

### 2.1 Supabase Variables (REQUIRED)

W Vercel Dashboard → Settings → Environment Variables, dodaj:

| Variable Name | Where to Get | Example |
|---------------|--------------|---------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key | `eyJhbGci...` (długi string) |

**WAŻNE**: Użyj **anon key**, NIE service_role key!

### 2.2 Sentry Variables (OPTIONAL - monitoring)

Jeśli chcesz error monitoring:

| Variable Name | Where to Get |
|---------------|--------------|
| `VITE_SENTRY_DSN` | Sentry → Settings → Projects → Keys |
| `VITE_SENTRY_ORG` | Twoja organization slug |
| `VITE_SENTRY_PROJECT` | Nazwa projektu |
| `VITE_SENTRY_AUTH_TOKEN` | Sentry → Settings → Auth Tokens |

**Możesz pominąć** - aplikacja będzie działać bez Sentry.

### 2.3 Deploy!

```bash
1. Kliknij "Save" na environment variables
2. Vercel automatycznie zrobi deploy
3. Poczekaj 2-3 minuty
```

---

## 🔧 KROK 3: Supabase Edge Functions (10 minut)

Twoje funkcje serverless potrzebują konfiguracji.

### 3.1 Podstawowe Secrets

W Supabase Dashboard → Edge Functions → Secrets, dodaj:

```bash
# Auto-injected (nie musisz dodawać ręcznie):
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (service_role key z Settings → API)

# MUSISZ dodać:
FRONTEND_URL=https://twoja-app.vercel.app
```

### 3.2 Email Sending (REQUIRED dla wysyłania ofert)

```bash
1. Załóż konto: https://resend.com/signup (darmowy tier: 100 emaili/dzień)
2. Stwórz API key: https://resend.com/api-keys
3. W Supabase Secrets dodaj:
   RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 3.3 AI Provider (REQUIRED dla generowania ofert)

**Wybierz JEDEN** z poniższych:

**Opcja A: OpenAI** (najbardziej stabilny, $5/miesiąc)
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```
Get from: https://platform.openai.com/api-keys

**Opcja B: Anthropic Claude** (dobra jakość, podobna cena)
```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```
Get from: https://console.anthropic.com/settings/keys

**Opcja C: Google Gemini** (darmowy tier!)
```bash
GEMINI_API_KEY=AIzaxxxxxxxxxxxxx
```
Get from: https://makersuite.google.com/app/apikey

---

## ✅ KROK 4: Weryfikacja (5 minut)

### 4.1 Podstawowy Smoke Test

1. **Otwórz deployment URL** (z Vercel Dashboard)
2. **Zarejestruj się** (nowy użytkownik)
3. **Sprawdź email** (potwierdzenie od Supabase)
4. **Zaloguj się**
5. **Stwórz projekt testowy**
6. **Wygeneruj ofertę** (sprawdź AI)
7. **Wyślij ofertę emailem** (sprawdź Resend)

### 4.2 Sprawdź Logi

**Vercel Logs**:
```bash
Vercel Dashboard → Deployments → [latest] → Function Logs
```

**Supabase Logs**:
```bash
Supabase Dashboard → Logs → Edge Functions
```

### 4.3 Sprawdź Sentry (jeśli skonfigurowany)

```bash
Sentry Dashboard → Projects → [twój projekt] → Issues
```

Nie powinno być żadnych errorów!

---

## 🎯 Gotowe! Co dalej?

### Natychmiastowe:
- [ ] Skonfiguruj custom domain (Vercel → Settings → Domains)
- [ ] Dodaj domenę do Supabase Auth (Settings → Authentication → URL Configuration)
- [ ] Test na mobile (PWA install prompt powinien działać)

### W ciągu tygodnia:
- [ ] Zapros 2-3 beta testerów
- [ ] Monitoruj Sentry errors (jeśli skonfigurowany)
- [ ] Sprawdź usage metrics (Supabase Dashboard)

### Długoterminowo:
- [ ] Setup Supabase database backups
- [ ] Dodaj Google Analytics
- [ ] Landing page dla marketing

---

## 🆘 Troubleshooting

### Problem: "Failed to fetch" w aplikacji
**Przyczyna**: Zła VITE_SUPABASE_URL
**Fix**: Sprawdź czy URL jest dokładnie z Supabase Settings → API

### Problem: Nie mogę się zalogować
**Przyczyna**: Supabase Auth nie ma Vercel URL
**Fix**: Supabase → Settings → Authentication → URL Configuration → Add Vercel URL

### Problem: AI nie generuje ofert
**Przyczyna**: Brak API key w Edge Functions secrets
**Fix**: Sprawdź czy dodałeś OPENAI_API_KEY/ANTHROPIC_API_KEY/GEMINI_API_KEY

### Problem: Nie wysyła emaili
**Przyczyna**: Brak RESEND_API_KEY
**Fix**: Sprawdź czy klucz jest aktywny w Resend Dashboard

---

## 📚 Więcej Dokumentacji

- **Szczegółowa konfiguracja**: `/docs/VERCEL_DEPLOYMENT_GUIDE.md`
- **AI Providers**: `/docs/AI_PROVIDERS_REFERENCE.md`
- **Supabase Setup**: `/docs/SUPABASE_SETUP_GUIDE.md`
- **Environment Variables**: `/docs/ENVIRONMENT_VARIABLES_CHECKLIST.md`

---

## ✨ Tips

💡 **Darmowy tier wystarcza** na start:
- Vercel: Unlimited deploys
- Supabase: 500MB database, 2GB bandwidth
- Resend: 100 emaili/dzień
- Google Gemini: Darmowy (z limitami)

💡 **Monitoruj koszty**:
- OpenAI: ~$5-20/miesiąc przy normalnym użyciu
- Supabase: Darmowy do ~50-100 użytkowników
- Vercel: Darmowy dla hobbystów

💡 **Security best practices**:
- ✅ Używaj anon key w frontend (nie service_role!)
- ✅ Wszystkie env variables w Vercel, nie w repo
- ✅ Enable 2FA na Vercel, Supabase, GitHub
- ✅ Regularnie sprawdzaj Sentry errors

---

**Czas trwania całego procesu**: ~30 minut
**Następny krok**: Zaproś beta testerów i zbieraj feedback! 🚀
