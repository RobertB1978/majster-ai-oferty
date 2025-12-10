# Majster.AI - Przewodnik Migracji

## Spis treści
1. [Przegląd](#przegląd)
2. [Wymagania](#wymagania)
3. [Migracja AI - Konfiguracja Providerów](#migracja-ai---konfiguracja-providerów)
4. [Migracja bazy danych](#migracja-bazy-danych)
5. [Deployment na własnym serwerze](#deployment-na-własnym-serwerze)
6. [Konfiguracja zmiennych środowiskowych](#konfiguracja-zmiennych-środowiskowych)
7. [Testowanie po migracji](#testowanie-po-migracji)

---

## Przegląd

Majster.AI to aplikacja SaaS dla firm budowlanych i remontowych. Domyślnie działa w środowisku Lovable z automatyczną konfiguracją AI i bazy danych. Ten przewodnik opisuje jak przenieść aplikację na własną infrastrukturę.

### Komponenty wymagające migracji

| Komponent | W Lovable | Po migracji |
|-----------|-----------|-------------|
| Frontend | Automatyczny hosting | Vercel, Netlify, własny serwer |
| Backend | Supabase Edge Functions | Supabase (self-hosted lub cloud) |
| Baza danych | Lovable Cloud (Supabase) | Supabase Cloud lub PostgreSQL |
| AI | Lovable AI Gateway | OpenAI / Anthropic / Google Gemini |
| Autentykacja | Supabase Auth | Supabase Auth (bez zmian) |
| Storage | Supabase Storage | Supabase Storage (bez zmian) |

---

## Wymagania

### Minimalne wymagania
- Node.js 18+ lub Bun
- Konto Supabase (cloud lub self-hosted)
- Klucz API jednego z providerów AI:
  - OpenAI API Key
  - Anthropic API Key
  - Google AI (Gemini) API Key

### Opcjonalne
- Domena z certyfikatem SSL
- Serwer do hostingu (VPS, cloud)

---

## Migracja AI - Konfiguracja Providerów

### Automatyczne wykrywanie providera

System automatycznie wykrywa skonfigurowanego providera AI na podstawie zmiennych środowiskowych w kolejności:

1. `OPENAI_API_KEY` → OpenAI
2. `ANTHROPIC_API_KEY` → Anthropic Claude
3. `GEMINI_API_KEY` lub `GOOGLE_AI_API_KEY` → Google Gemini
4. `LOVABLE_API_KEY` → Lovable AI Gateway (tylko w Lovable)

### Opcja 1: OpenAI

```bash
# Dodaj do secrets w Supabase Dashboard
OPENAI_API_KEY=sk-...
```

**Wspierane modele:**
- `gpt-4o` - najnowszy, szybki, obsługuje obrazy
- `gpt-4o-mini` - tańszy, szybszy
- `gpt-4-turbo` - zaawansowane zadania
- `gpt-3.5-turbo` - najtańszy

**Koszt orientacyjny:** ~$0.01-0.03 za zapytanie

### Opcja 2: Anthropic Claude

```bash
# Dodaj do secrets w Supabase Dashboard
ANTHROPIC_API_KEY=sk-ant-...
```

**Wspierane modele:**
- `claude-3-5-sonnet-20241022` - rekomendowany, dobry stosunek cena/jakość
- `claude-3-opus-20240229` - najlepszy do skomplikowanych zadań
- `claude-3-haiku-20240307` - najszybszy i najtańszy

**Koszt orientacyjny:** ~$0.01-0.05 za zapytanie

### Opcja 3: Google Gemini

```bash
# Dodaj do secrets w Supabase Dashboard
GEMINI_API_KEY=AIza...
# lub
GOOGLE_AI_API_KEY=AIza...
```

**Wspierane modele:**
- `gemini-2.5-flash` - szybki, darmowy limit
- `gemini-2.5-pro` - najlepszy do złożonych zadań
- `gemini-1.5-pro` - stabilny, sprawdzony

**Koszt orientacyjny:** Darmowy tier do 15 zapytań/min, potem ~$0.005-0.02

### Uzyskanie kluczy API

#### OpenAI
1. Wejdź na [platform.openai.com](https://platform.openai.com)
2. Zarejestruj się / zaloguj
3. Przejdź do API Keys → Create new secret key
4. Dodaj środki na koncie (Pay-as-you-go)

#### Anthropic
1. Wejdź na [console.anthropic.com](https://console.anthropic.com)
2. Zarejestruj się / zaloguj
3. Przejdź do API Keys → Create Key
4. Dodaj środki na koncie

#### Google Gemini
1. Wejdź na [aistudio.google.com](https://aistudio.google.com)
2. Zaloguj się kontem Google
3. Kliknij "Get API Key" → "Create API key"
4. Darmowy tier: 15 req/min, 1500 req/dzień

---

## Migracja bazy danych

### Eksport z Lovable Cloud

1. W Lovable, kliknij "View Backend"
2. Przejdź do SQL Editor
3. Wykonaj:
```sql
-- Eksport wszystkich danych
SELECT * FROM clients;
SELECT * FROM projects;
SELECT * FROM quotes;
-- ... pozostałe tabele
```

### Import do nowego Supabase

1. Utwórz projekt na [supabase.com](https://supabase.com)
2. Uruchom migracje (skopiuj z `supabase/migrations/`)
3. Zaimportuj dane

### Schema bazy danych

Plik `src/integrations/supabase/types.ts` zawiera pełną definicję schematu. Główne tabele:

- `clients` - klienci
- `projects` - projekty
- `quotes` - wyceny
- `item_templates` - szablony pozycji
- `profiles` - profile firm
- `calendar_events` - kalendarz
- `purchase_costs` - koszty zakupów
- `offer_sends` - historia wysyłek ofert

---

## Deployment na własnym serwerze

### Opcja 1: Vercel (rekomendowane dla frontendu)

```bash
# Zainstaluj Vercel CLI
npm i -g vercel

# Zaloguj się
vercel login

# Deploy
vercel --prod
```

Dodaj zmienne środowiskowe w Vercel Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Opcja 2: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

```bash
docker build -t majster-ai .
docker run -p 80:80 majster-ai
```

### Opcja 3: VPS z Nginx

```bash
# Na serwerze
npm install
npm run build

# Konfiguracja Nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/majster-ai/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Deployment Edge Functions

Edge Functions wymagają Supabase CLI:

```bash
# Zainstaluj Supabase CLI
npm install -g supabase

# Zaloguj się
supabase login

# Połącz z projektem
supabase link --project-ref YOUR_PROJECT_REF

# Deploy funkcji
supabase functions deploy ai-chat-agent
supabase functions deploy voice-quote-processor
supabase functions deploy ai-quote-suggestions
supabase functions deploy analyze-photo
supabase functions deploy ocr-invoice
supabase functions deploy finance-ai-analysis
supabase functions deploy send-offer-email
```

---

## Konfiguracja zmiennych środowiskowych

### Frontend (.env)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Backend (Supabase Secrets)

W Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
# AI Provider (wybierz jeden)
OPENAI_API_KEY=sk-...
# lub
ANTHROPIC_API_KEY=sk-ant-...
# lub
GEMINI_API_KEY=AIza...

# Email (opcjonalne - dla wysyłki ofert)
RESEND_API_KEY=re_...
```

---

## Testowanie po migracji

### Checklist

- [ ] Frontend ładuje się poprawnie
- [ ] Logowanie działa
- [ ] Lista projektów się wyświetla
- [ ] Można utworzyć nowego klienta
- [ ] Można utworzyć nowy projekt
- [ ] AI Chat Agent odpowiada
- [ ] Głosowe tworzenie wycen działa
- [ ] Generowanie PDF działa
- [ ] Wysyłka emaili działa

### Test AI

```bash
# Test edge function
curl -X POST https://your-project.supabase.co/functions/v1/ai-chat-agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"message": "Ile kosztuje malowanie pokoju 20m2?"}'
```

### Monitoring

1. Sprawdzaj logi w Supabase Dashboard → Edge Functions → Logs
2. Monitoruj zużycie API w panelach providerów AI
3. Ustaw alerty na błędy i rate limity

---

## Rozwiązywanie problemów

### AI nie odpowiada

1. Sprawdź czy klucz API jest poprawny
2. Sprawdź logi Edge Function
3. Zweryfikuj środki na koncie providera AI

### Błędy CORS

Upewnij się, że nagłówki CORS są poprawne:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### Błędy autentykacji

1. Sprawdź czy `VITE_SUPABASE_ANON_KEY` jest poprawny
2. Zweryfikuj RLS policies w Supabase

---

## Wsparcie

- Dokumentacja Supabase: [supabase.com/docs](https://supabase.com/docs)
- Dokumentacja OpenAI: [platform.openai.com/docs](https://platform.openai.com/docs)
- Dokumentacja Anthropic: [docs.anthropic.com](https://docs.anthropic.com)
- Dokumentacja Google AI: [ai.google.dev](https://ai.google.dev)

---

## Licencja

MIT License - możesz swobodnie modyfikować i dystrybuować aplikację.
