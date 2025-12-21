# Majster.AI - Platforma SaaS dla Firm Budowlanych 🏗️

> **Zarządzaj swoją firmą budowlaną z AI:** Klienci, Projekty, Oferty, Faktury, Finanse - wszystko w jednym miejscu.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E)](https://supabase.com/)

---

## 📖 Spis treści

- [O projekcie](#-o-projekcie)
- [Funkcje](#-funkcje)
- [Technologie](#-technologie)
- [Szybki start](#-szybki-start)
- [Dokumentacja](#-dokumentacja)
- [Wdrożenie](#-wdrożenie)
- [Development](#-development)
- [Contributing](#-contributing)
- [Licencja](#-licencja)

---

## 🎯 O projekcie

**Majster.AI** to kompleksowa platforma SaaS zaprojektowana dla polskich firm budowlanych, remontowych i wykonawców. Aplikacja łączy zarządzanie projektami, klientami, ofertami i finansami z mocą sztucznej inteligencji.

### Dla kogo?

- 🏗️ Firmy budowlane
- 🔨 Wykonawcy i rzemieślnicy
- 🎨 Firmy remontowe
- 📐 Małe i średnie przedsiębiorstwa budowlane

### Dlaczego Majster.AI?

- ✅ **Wszystko w jednym miejscu** - nie potrzebujesz kilku aplikacji
- 🤖 **AI-powered** - automatyczne sugestie ofert, analiza zdjęć, OCR faktur
- 📱 **Responsywne** - działa na komputerze, tablecie i smartfonie
- 🇵🇱 **Polski język** - w pełni spolszczona aplikacja
- 💰 **Darmowy start** - wykorzystuj darmowe tiery Vercel i Supabase

---

## ✨ Funkcje

### Zarządzanie Klientami
- 📇 Baza klientów z pełną historią
- 📊 Statystyki i raporty
- 🔍 Szybkie wyszukiwanie

### Projekty i Oferty
- 📝 Tworzenie profesjonalnych ofert/kosztorysów
- 🤖 **AI-powered sugestie** pozycji i cen
- 📄 Generowanie PDF
- 📧 Wysyłka ofert emailem
- ✅ System zatwierdzania ofert przez klienta

### Zarządzanie Finansami
- 💵 Faktury i płatności
- 📈 Raporty finansowe
- 💰 Śledzenie kosztów i materiałów
- 🤖 **AI analiza finansowa**

### Dokumenty i Media
- 📷 Zarządzanie zdjęciami projektów
- 🤖 **AI analiza zdjęć** - automatyczne rozpoznawanie prac
- 🧾 **OCR faktur** - automatyczne przetwarzanie faktur

### Współpraca zespołowa
- 👥 Zarządzanie zespołem
- 📅 Kalendarz i harmonogramy
- ✅ System zadań
- 🔔 Powiadomienia

### Marketplace
- 🛒 Łączenie z klientami
- 📢 Promowanie usług
- ⭐ System opinii

---

## 🛠 Technologie

### Frontend
- **React 18.3** - UI library
- **TypeScript 5.8** - Type-safe JavaScript
- **Vite 5.4** - Lightning-fast build tool
- **Tailwind CSS 3.4** - Utility-first CSS
- **shadcn/ui** - Beautiful component library
- **TanStack Query 5.83** - Server state management
- **React Hook Form + Zod** - Forms & validation
- **Framer Motion** - Smooth animations

### Backend
- **Supabase** - Complete backend platform
  - PostgreSQL database with RLS
  - Edge Functions (Deno runtime)
  - Authentication & Authorization
  - Real-time subscriptions
  - Storage

### AI/ML
- **OpenAI API** - GPT-4 dla generowania ofert
- **Anthropic Claude** - Alternative AI provider
- **Google Gemini** - Darmowy AI provider
- Analiza zdjęć i OCR

### Infrastructure
- **Vercel** - Frontend hosting & deployment
- **GitHub Actions** - CI/CD pipeline
- **Sentry** - Error monitoring (opcjonalnie)

---

## 🚀 Szybki start

### Wymagania

- **Node.js 20+** (rekomendowana: 20.19.5) - sprawdź: `node --version`
- **npm 10+** (⚠️ **NIE** używaj bun, pnpm ani yarn)
- **Konto Supabase** (darmowe tier wystarczy) - [supabase.com](https://supabase.com)
- **Konto Vercel** (darmowe) - tylko do wdrożenia - [vercel.com](https://vercel.com)

**📝 Zmienne środowiskowe:**
- Lokalne: skopiuj [`.env.example`](./.env.example) → `.env` i wypełnij wartości
- Vercel: ustaw w Dashboard → Settings → Environment Variables (Production, Preview, Development)
- Szczegóły: [Environment Variables Checklist](./docs/ENVIRONMENT_VARIABLES_CHECKLIST.md)

### Lokalne uruchomienie (5 minut)

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/RobertB1978/majster-ai-oferty.git
cd majster-ai-oferty

# 2. Zainstaluj zależności (TYLKO npm!)
npm install

# 3. Skopiuj i skonfiguruj .env
cp .env.example .env
# Edytuj .env i wypełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY

# 4. Uruchom dev server
npm run dev

# 5. Otwórz w przeglądarce
# http://localhost:8080
```

**📖 Szczegóły:** Zobacz [docs/QUICK_START.md](./docs/QUICK_START.md)

---

## 📚 Dokumentacja

### Dla użytkowników

- 🚀 **[Quick Start Guide](./docs/QUICK_START.md)** - Szybkie uruchomienie (5 min)
- 🌐 **[Vercel Deployment Guide](./docs/VERCEL_DEPLOYMENT_GUIDE.md)** - Wdrożenie krok po kroku
- ✅ **[Environment Variables Checklist](./docs/ENVIRONMENT_VARIABLES_CHECKLIST.md)** - Wszystkie zmienne środowiskowe
- 🔍 **[Deployment Verification Checklist](./docs/DEPLOYMENT_VERIFICATION_CHECKLIST.md)** - Weryfikacja wdrożenia

### Dla developerów

- 📘 **[CLAUDE.md](./CLAUDE.md)** - Główny przewodnik projektu, architektura, zasady
- 🗄️ **[Supabase Setup Guide](./docs/SUPABASE_SETUP_GUIDE.md)** - Konfiguracja Supabase
- 🔄 **[Migration Guide](./docs/MIGRATION_GUIDE.md)** - Migracja z Lovable
- 🤖 **[AI Providers Reference](./docs/AI_PROVIDERS_REFERENCE.md)** - Konfiguracja OpenAI/Claude/Gemini
- 🔒 **[Monitoring & Security Setup](./docs/MONITORING_SECURITY_SETUP.md)** - Security best practices

### Inne

- 📊 **[Performance Notes](./docs/PERFORMANCE_NOTES.md)** - Optymalizacja wydajności
- 🎓 **[Comprehensive Audit 2026](./docs/COMPREHENSIVE_AUDIT_2026.md)** - Pełny audyt aplikacji
- 🟡 **[Known Issues](./docs/KNOWN_ISSUES.md)** - Znane problemy i monitoring

---

## 🌐 Wdrożenie

### Vercel (15 minut)

```bash
# Opcja 1: Przez dashboard (najłatwiejsze)
# 1. Idź na https://vercel.com
# 2. Połącz repozytorium GitHub
# 3. Dodaj environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
# 4. Deploy!

# Opcja 2: Przez CLI
npm i -g vercel
vercel
```

**📖 Pełny przewodnik:** [docs/VERCEL_DEPLOYMENT_GUIDE.md](./docs/VERCEL_DEPLOYMENT_GUIDE.md)

### Supabase (30 minut)

```bash
# 1. Utwórz projekt na supabase.com
# 2. Zainstaluj CLI
npm install -g supabase

# 3. Zaloguj się i połącz
supabase login
supabase link --project-ref your-project-id

# 4. Uruchom migracje
supabase db push

# 5. Wdróż Edge Functions
supabase functions deploy
```

**📖 Pełny przewodnik:** [docs/SUPABASE_SETUP_GUIDE.md](./docs/SUPABASE_SETUP_GUIDE.md)

---

## 💻 Development

### ⚠️ Package Manager Policy

**This project uses npm as the canonical package manager.**

**✅ ALWAYS use:**
- `npm install`
- `npm run dev`
- `npm run build`

**❌ DO NOT use:**
- `bun install`
- `pnpm install`
- `yarn install`

**Why npm only?**
1. **Consistency** - All developers and CI use the same dependency resolution
2. **Single lock file** - Only `package-lock.json` is maintained
3. **Easier debugging** - Fewer variables when troubleshooting issues

The `preinstall` script will automatically block non-npm package managers.

If you accidentally created `bun.lockb`, `pnpm-lock.yaml`, or `yarn.lock`:
```bash
rm -f bun.lockb pnpm-lock.yaml yarn.lock
npm install
```

### Przydatne komendy

```bash
# Development
npm run dev              # Dev server (localhost:8080)
npm run build            # Production build
npm run preview          # Preview production build

# Quality
npm run lint             # ESLint
npm run lint:fix         # Auto-fix lint issues
npm run type-check       # TypeScript check
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
npm run e2e              # Playwright (uses npm run preview on 127.0.0.1:4173)
npm run size:check       # Enforce bundle budgets (needs dist/ from build)

# Playwright will skip gracefully if VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing.
# In CI set them as GitHub Secrets; locally place them in your .env file.

# Cleaning
npm run clean            # Clean build artifacts
npm run clean:all        # Clean everything (including node_modules)
```

### Struktura projektu

```
majster-ai-oferty/
├── src/                    # Frontend kod
│   ├── components/         # React komponenty
│   ├── pages/             # Strony (routes)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   └── integrations/      # Supabase client
├── supabase/              # Backend
│   ├── migrations/        # DB migrations
│   └── functions/         # Edge Functions
├── docs/                  # Dokumentacja
├── public/                # Statyczne pliki
└── ...konfiguracja
```

### Coding standards

- ✅ TypeScript strict mode (zgodnie z projektem)
- ✅ ESLint + Prettier
- ✅ Functional components + Hooks
- ✅ TanStack Query dla server state
- ✅ Zod dla walidacji
- ✅ Tailwind dla stylów

**📖 Szczegóły:** Zobacz [CLAUDE.md](./CLAUDE.md) - sekcja "Coding Standards"

---

## 🤝 Contributing

Projekt jest otwarty na kontrybucje! Przed rozpoczęciem pracy:

1. Przeczytaj [CLAUDE.md](./CLAUDE.md) - poznaj zasady i architekturę
2. Fork repozytorium
3. Utwórz branch: `git checkout -b feature/amazing-feature`
4. Commituj zmiany: `git commit -m 'feat: Add amazing feature'`
5. Push do brancha: `git push origin feature/amazing-feature`
6. Utwórz Pull Request

### Konwencje commitów

```
feat: Nowa funkcja
fix: Naprawa błędu
docs: Zmiany w dokumentacji
style: Formatowanie kodu
refactor: Refaktoryzacja kodu
test: Dodanie/aktualizacja testów
chore: Maintenance (deps, config)
```

---

## 🐛 Zgłaszanie błędów

Znalazłeś bug? Pomóż nam go naprawić!

1. Sprawdź [Issues](https://github.com/RobertB1978/majster-ai-oferty/issues) czy nie został już zgłoszony
2. Utwórz nowy issue z szczegółowym opisem:
   - Kroki do reprodukcji
   - Oczekiwane zachowanie
   - Rzeczywiste zachowanie
   - Screenshots (jeśli możliwe)
   - Środowisko (browser, OS, wersja)

---

## 📝 Licencja

Ten projekt jest udostępniony na licencji MIT.

---

## 🙏 Podziękowania

Projekt wykorzystuje następujące open-source libraries:

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query)
- I wiele innych - zobacz [package.json](./package.json)

---

## 📞 Kontakt

- **GitHub Issues:** [github.com/RobertB1978/majster-ai-oferty/issues](https://github.com/RobertB1978/majster-ai-oferty/issues)
- **GitHub Discussions:** [Dyskusje](https://github.com/RobertB1978/majster-ai-oferty/discussions)

---

## 🎯 Roadmap

- [x] Core functionality (klienci, projekty, oferty)
- [x] AI-powered quote suggestions
- [x] PDF generation & email delivery
- [x] Photo analysis
- [x] OCR invoice processing
- [ ] Mobile app (Capacitor)
- [ ] Advanced analytics & reporting
- [ ] Integration with accounting systems
- [ ] API for third-party integrations
- [ ] White-label solution

---

**Stworzono z ❤️ dla polskich firm budowlanych**

**⭐ Jeśli projekt Ci się podoba, zostaw gwiazdkę na GitHub!**
