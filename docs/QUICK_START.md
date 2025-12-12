# Majster.AI - Quick Start Guide 🚀

> **Dla kogo?** Ten przewodnik jest dla każdego, kto chce szybko uruchomić Majster.AI lokalnie lub wdrożyć na Vercel.

## ⚡ Szybki Start (5 minut)

### Wymagania

- Node.js 20+ (sprawdź: `node --version`)
- npm (sprawdź: `npm --version`)
- Konto Supabase (darmowe)
- Konto Vercel (darmowe) - tylko do wdrożenia

---

## 🏃 Lokalne uruchomienie

### Krok 1: Sklonuj repozytorium

```bash
git clone https://github.com/RobertB1978/majster-ai-oferty.git
cd majster-ai-oferty
```

### Krok 2: Zainstaluj zależności

```bash
npm install --legacy-peer-deps
```

### Krok 3: Skonfiguruj zmienne środowiskowe

```bash
# Skopiuj przykładowy plik
cp .env.example .env

# Edytuj .env (użyj ulubionego edytora)
nano .env
```

Wypełnij **minimum**:
```env
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=twoj-anon-key
```

**Gdzie znaleźć?**
1. Idź do: https://supabase.com/dashboard
2. Wybierz projekt (lub utwórz nowy)
3. Settings → API
4. Skopiuj **Project URL** i **anon public** key

### Krok 4: Uruchom aplikację

```bash
npm run dev
```

Otwórz: http://localhost:8080

✅ **Działa!** Możesz się zarejestrować i zacząć używać aplikacji.

---

## ☁️ Wdrożenie na Vercel (15 minut)

### Opcja A: Przez Vercel Dashboard (najłatwiejsze)

1. Idź do: https://vercel.com
2. Zaloguj się przez GitHub
3. Kliknij **"Add New... → Project"**
4. Wybierz repozytorium: `RobertB1978/majster-ai-oferty`
5. Dodaj Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Kliknij **"Deploy"**
7. Czekaj 2-3 minuty

✅ **Gotowe!** Aplikacja jest live!

### Opcja B: Przez CLI (dla zaawansowanych)

```bash
# Zainstaluj Vercel CLI
npm i -g vercel

# Deploy
vercel

# Ustaw environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Production deploy
vercel --prod
```

---

## 🗄️ Konfiguracja Supabase (30 minut)

### Krok 1: Utwórz projekt

1. https://supabase.com/dashboard
2. **"New Project"**
3. Nazwij projekt: `majster-ai-production`
4. Wybierz region: `Europe West (London)`
5. Zapisz hasło do bazy!

### Krok 2: Uruchom migracje

**Opcja A: Przez Supabase CLI (zalecane)**

```bash
# Zainstaluj CLI
npm install -g supabase

# Zaloguj się
supabase login

# Połącz z projektem
supabase link --project-ref twoj-project-id

# Uruchom migracje
supabase db push
```

**Opcja B: Przez SQL Editor**

1. Supabase Dashboard → **SQL Editor**
2. Skopiuj każdy plik z `supabase/migrations/`
3. Uruchom po kolei (od najstarszego)

### Krok 3: Skonfiguruj sekrety dla Edge Functions

Supabase Dashboard → **Edge Functions → Secrets**:

**Minimum wymagane:**
```
SUPABASE_URL = https://twoj-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY = twoj-service-role-key
FRONTEND_URL = https://twoja-aplikacja.vercel.app
```

**Dla AI features (wybierz jeden):**
```
OPENAI_API_KEY = sk-...
```
lub
```
ANTHROPIC_API_KEY = sk-ant-...
```
lub
```
GEMINI_API_KEY = AIza...  (DARMOWY!)
```

**Dla wysyłki emaili:**
```
RESEND_API_KEY = re_...
```

### Krok 4: Wdróż Edge Functions

```bash
supabase functions deploy
```

---

## ✅ Weryfikacja

### Czy wszystko działa?

1. **Otwórz aplikację** (Vercel URL lub localhost)
2. **Zarejestruj się** (nowe konto)
3. **Zaloguj się**
4. **Utwórz klienta**
5. **Utwórz ofertę**
6. **Sprawdź czy się zapisała**

✅ Jeśli tak - **gratulacje!** 🎉

❌ Jeśli nie - sprawdź:
- Konsolę przeglądarki (F12)
- Vercel Deployment Logs
- Supabase Edge Functions Logs

---

## 📚 Następne kroki

### Dla początkujących

1. Przeczytaj: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
2. Przejrzyj: [ENVIRONMENT_VARIABLES_CHECKLIST.md](./ENVIRONMENT_VARIABLES_CHECKLIST.md)
3. Skonfiguruj AI provider: [AI_PROVIDERS_REFERENCE.md](./AI_PROVIDERS_REFERENCE.md)

### Dla zaawansowanych

1. Skonfiguruj domenę własną
2. Włącz Sentry monitoring
3. Dostosuj RLS policies
4. Zoptymalizuj performance
5. Skonfiguruj CI/CD

---

## 🎯 Najczęstsze problemy

### "Missing Supabase environment variables"

**Rozwiązanie:**
- Sprawdź czy `.env` zawiera `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`
- Sprawdź czy wartości są poprawne (bez spacji)
- Restart dev servera: `npm run dev`

### Build fails na Vercel

**Rozwiązanie:**
- Sprawdź czy environment variables są ustawione w Vercel
- Sprawdź Deployment Logs
- Lokalnie: `npm run build` i zobacz błędy

### Nie mogę się zalogować

**Rozwiązanie:**
- Sprawdź spam folder (email weryfikacyjny)
- Supabase → Authentication → URL Configuration → dodaj Vercel URL
- Sprawdź Supabase Auth Logs

### AI nie działa

**Rozwiązanie:**
- Sprawdź czy `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` jest w Supabase Secrets
- Sprawdź Edge Functions Logs
- Sprawdź czy masz kredyty na koncie AI providera

---

## 💰 Koszty

### Darmowy tier (wystarczy na start)

| Usługa | Darmowy limit | Koszt po przekroczeniu |
|--------|---------------|------------------------|
| **Vercel** | 100 GB bandwidth/miesiąc | $20/miesiąc (Pro) |
| **Supabase** | 500 MB database, 2 GB bandwidth | $25/miesiąc (Pro) |
| **Resend** | 100 emaili/dzień | $20/miesiąc za 50k |
| **Gemini** | 60 requestów/minutę | Darmowe! |
| **OpenAI** | $0 (pay as you go) | ~$0.01-0.03/request |

**Szacowany koszt startowy:** $0/miesiąc (z darmowymi tierami)

---

## 🆘 Potrzebujesz pomocy?

1. **Dokumentacja:**
   - [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) - pełny deployment guide
   - [ENVIRONMENT_VARIABLES_CHECKLIST.md](./ENVIRONMENT_VARIABLES_CHECKLIST.md) - env vars
   - [DEPLOYMENT_VERIFICATION_CHECKLIST.md](./DEPLOYMENT_VERIFICATION_CHECKLIST.md) - weryfikacja
   - [AI_PROVIDERS_REFERENCE.md](./AI_PROVIDERS_REFERENCE.md) - konfiguracja AI

2. **GitHub Issues:**
   - https://github.com/RobertB1978/majster-ai-oferty/issues

3. **Support platform:**
   - Vercel: https://vercel.com/support
   - Supabase: https://supabase.com/support

---

## 🎓 Przydatne komendy

```bash
# Development
npm run dev              # Uruchom dev server
npm run build            # Zbuduj dla produkcji
npm run preview          # Podgląd production build
npm run lint             # Sprawdź kod (linting)
npm run type-check       # Sprawdź typy TypeScript
npm test                 # Uruchom testy

# Supabase
supabase login           # Zaloguj się
supabase link            # Połącz z projektem
supabase db push         # Uruchom migracje
supabase functions deploy # Wdróż Edge Functions
supabase start           # Uruchom lokalnie (opcjonalnie)

# Vercel
vercel                   # Deploy do preview
vercel --prod            # Deploy do production
vercel env ls            # Lista env variables
vercel logs              # Zobacz logi
```

---

**🚀 Powodzenia z Majster.AI!**

**💡 Tip:** Zacznij od lokalnego uruchomienia, przetestuj funkcjonalności, a potem wdróż na Vercel.

**📖 Pamiętaj:** Przeczytaj [CLAUDE.md](../CLAUDE.md) dla pełnego zrozumienia projektu.
