# CLAUDE.md

## Język komunikacji / Communication Language

**OBOWIĄZKOWE:** Cała komunikacja z właścicielem projektu MUSI być prowadzona w języku polskim.
Dotyczy to: odpowiedzi na pytania, opisów commitów, komentarzy w PR, wyjaśnień technicznych,
raportów i wszelkiej innej komunikacji. Komentarze w kodzie mogą być po angielsku (standard branżowy),
ale komunikacja z użytkownikiem — zawsze po polsku.

---

## 🚀 Obowiązkowy Start Sesji (WARUNEK KONIECZNY)

> **Geneza:** Agent wielokrotnie pomijał wytyczne z CLAUDE.md, ponieważ nie czytał ich
> na początku sesji. Poniższy protokół jest WARUNKIEM KONIECZNYM rozpoczęcia jakiejkolwiek pracy.

### Przed rozpoczęciem JAKIEGOKOLWIEK zadania, agent MUSI:

1. **Przeczytać CAŁY plik CLAUDE.md** — od początku do końca, NIE pomijać żadnej sekcji
2. **Przeczytać CAŁY prompt zadania** — od początku do końca, NIE skanować
3. **Rozłożyć prompt na atomowe wymagania** — wypisać KAŻDE wymaganie jako osobny punkt w TodoWrite:
   - Każdy numerowany punkt z promptu → osobne todo
   - Każdy bullet z sekcji REQUIRED / MANDATORY → osobne todo
   - Każdy element DOD / Definition of Done → osobne todo
   - Każdy "mandatory output" → osobne todo
   - Każde pytanie wymagające jawnej odpowiedzi → osobne todo
4. **Pokazać użytkownikowi listę wymagań** i zapytać: "Czy ta lista jest kompletna? Czy coś pominąłem?"
5. **Dopiero po potwierdzeniu** — zacząć pracę

**Reguła twarda:** Jeśli agent nie przeczytał CLAUDE.md i nie rozłożył promptu na todo — KAŻDA deklaracja "zrobione" jest nieważna.

**Reguła dla kontynuacji sesji:** Jeśli sesja jest kontynuacją poprzedniej — agent MUSI przeczytać CLAUDE.md ponownie (wytyczne mogły się zmienić) i odtworzyć kontekst z poprzedniej sesji.

---

## 🚨 Globalne Zasady Operacyjne (OBOWIĄZKOWE — każda sesja)

Poniższe zasady mają bezwzględny priorytet i obowiązują w **każdej** sesji, bez wyjątków.

| # | Zasada | Opis |
|---|--------|------|
| 1 | **main = produkcja** | Każdy commit na `main` jest natychmiast na żywo. Działaj z pełną ostrożnością. |
| 2 | **Jedna zmiana = jeden PR** | Nie łącz niepowiązanych poprawek w jednym PR. |
| 3 | **Brak zielonego CI = brak merge** | CI musi być zielone przed każdym merge. Bez wyjątków. |
| 4 | **Nie zgaduj** | Jeśli coś jest niejasne: STOP i zgłoś. Nie zakładaj. |
| 5 | **Nie rozszerzaj zakresu** | Jeśli znajdziesz coś dodatkowego: zaloguj, nie naprawiaj w tym PR. |
| 6 | **Nie modyfikuj istniejących migracji** | Tylko nowe migracje, idempotentne. |
| 7 | **Brak sekretów w logach i kodzie** | Żadnych sekretów w logach, kodzie, komentarzach, screenshotach ani opisach PR. |
| 8 | **Weryfikacja nie przeszła = STOP** | Zgłoś dokładny bloker. Robert decyduje o następnym kroku. |
| 9 | **Smoke test nie przeszedł = brak merge** | Twardy stop. Przywróć branch. |
| 10 | **Przegląd diffa przed finalizacją** | Każda zmieniona linia musi być uzasadniona. |
| 11 | **Rozdziel: agent vs Robert** | Jasno zaznacz co robi agent, a co Robert musi zrobić ręcznie. |
| 12 | **Evidence Log jest obowiązkowy** | Format: `symptom → dowód → zmiana → weryfikacja → rollback` |
| 13 | **Pass #3 = prompt linia po linii** | Przed finalizacją: wróć do oryginalnego promptu i odhaczyj KAŻDY punkt numerowany, każde "REQUIRED", każde "DOD", każde "mandatory output". Skanowanie "sedna" to za mało — poboczne wymagania (log decyzji, feature flag decision, format raportu) są równie obowiązkowe. |

### Evidence Log — szablon (obowiązkowy w każdym raporcie)

```
## Evidence Log
- Symptom:     [co było nie tak / co miało zostać zrobione]
- Dowód:       [plik:linia, błąd, log, screenshot]
- Zmiana:      [co dokładnie zostało zmienione]
- Weryfikacja: [wynik testów / build / lint / smoke test]
- Rollback:    [jak cofnąć tę zmianę jeśli coś pójdzie nie tak]
```

---

## Project Overview

**Majster.AI** is a SaaS platform designed for construction and renovation professionals in Poland. It helps contractors, builders, and renovation specialists manage their business operations efficiently through AI-powered tools.

**Core Features:**
- Client & Project Management
- AI-Assisted Estimate & Offer Generation
- PDF Document Generation (quotes, invoices, reports)
- Company Profile & Portfolio Management
- Task & Material Tracking
- Finance & Billing Management
- Calendar & Scheduling
- Marketplace for connecting with clients

**Target Users:** Construction professionals, renovation contractors, craftspeople, and small construction businesses in Poland.

---

## Tech Stack

### Frontend
- **React 18.3** - UI library
- **TypeScript 5.8** - Type-safe JavaScript
- **Vite 5.4** - Build tool and dev server
- **React Router 6.30** - Client-side routing
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - Component library (Radix UI primitives)
- **Framer Motion** - Animation library
- **TanStack Query 5.83** - Server state management
- **React Hook Form + Zod** - Form handling and validation
- **i18next** - Internationalization (Polish/English)
- **Recharts** - Data visualization
- **Leaflet** - Maps integration
- **Capacitor 7.4** - Mobile app capabilities

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Realtime subscriptions
  - Edge Functions (Deno runtime)
  - Authentication & Authorization
  - Storage

### AI/ML Services
- OpenAI API integration for quote generation and analysis
- Voice processing capabilities
- OCR for invoice processing
- Photo analysis

### Testing
- **Vitest 4.0** - Unit testing framework
- **Testing Library** - Component testing
- **jsdom** - DOM simulation

### Build & Development
- **ESLint 9** - Linting
- **TypeScript ESLint** - TypeScript-specific linting
- **npm** - Package management

---

## Repository Structure

```
majster-ai-oferty/
├── src/                          # Frontend source code
│   ├── components/               # React components (organized by feature)
│   │   ├── admin/                # Admin panel components
│   │   ├── ads/                  # Advertisement components
│   │   ├── ai/                   # AI-related components
│   │   ├── api/                  # API integration components
│   │   ├── auth/                 # Authentication components
│   │   ├── billing/              # Billing & payments
│   │   ├── branding/             # Branding & company identity
│   │   ├── calendar/             # Calendar & scheduling
│   │   ├── costs/                # Cost management components
│   │   ├── dashboard/            # Dashboard views
│   │   ├── documents/            # Document handling
│   │   ├── finance/              # Financial components
│   │   ├── layout/               # Layout components
│   │   ├── legal/                # Legal documents (terms, privacy)
│   │   ├── map/                  # Map integration components
│   │   ├── marketplace/          # Marketplace features
│   │   ├── notifications/        # Notifications system
│   │   ├── offers/               # Offer/quote generation
│   │   ├── onboarding/           # User onboarding flows
│   │   ├── organizations/        # Organization management
│   │   ├── photos/               # Photo management components
│   │   ├── plugins/              # Plugin system
│   │   ├── pwa/                  # Progressive Web App features
│   │   ├── quotes/               # Quote-related components
│   │   ├── seo/                  # SEO components
│   │   ├── settings/             # Settings panels
│   │   ├── team/                 # Team management
│   │   ├── ui/                   # Reusable UI components (shadcn)
│   │   └── voice/                # Voice input components
│   ├── pages/                    # Page-level components (routes)
│   ├── hooks/                    # Custom React hooks
│   ├── contexts/                 # React contexts
│   ├── lib/                      # Utility functions & helpers
│   ├── types/                    # TypeScript type definitions
│   ├── integrations/             # Third-party integrations (Supabase client)
│   ├── i18n/                     # Internationalization configs & translations
│   ├── test/                     # Test files and test utilities
│   ├── data/                     # Static data & constants
│   ├── App.tsx                   # Root React component
│   └── main.tsx                  # Application entry point
│
├── supabase/                     # Supabase backend
│   ├── migrations/               # Database migrations (timestamped)
│   ├── functions/                # Edge Functions (serverless)
│   │   ├── ai-chat-agent/        # AI chat functionality
│   │   ├── ai-quote-suggestions/ # AI quote generation
│   │   ├── analyze-photo/        # Photo analysis
│   │   ├── approve-offer/        # Offer approval logic
│   │   ├── finance-ai-analysis/  # Financial AI analysis
│   │   ├── ocr-invoice/          # Invoice OCR processing
│   │   ├── public-api/           # Public API endpoints
│   │   ├── send-expiring-offer-reminders/ # Scheduled reminders for expiring offers
│   │   ├── send-offer-email/     # Email notifications
│   │   ├── voice-quote-processor/# Voice input processing
│   │   └── _shared/              # Shared utilities for functions
│   └── config.toml               # Supabase configuration
│
├── public/                       # Static assets
├── docs/                         # Documentation
│   ├── AI_PROVIDERS_REFERENCE.md # Detailed AI provider documentation
│   └── MIGRATION_GUIDE.md        # Migration guide for self-hosting
├── .env                          # Environment variables (NOT in git)
├── capacitor.config.ts           # Capacitor mobile config
├── vite.config.ts                # Vite build configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies & scripts
└── README.md                     # Basic project info
```

---

## CRITICAL RULES (MANDATORY)

### 🚨 Database & Migrations

1. **NEVER modify existing migration files** in `supabase/migrations/`
   - Migrations are immutable once applied
   - Create NEW migration files for schema changes
   - Migration filename format: `YYYYMMDDHHMMSS_<uuid>.sql`

2. **NEVER rename database tables or columns**
   - Renaming breaks existing queries and RLS policies
   - Use database views or add new columns instead
   - If absolutely necessary, create migration with proper deprecation

3. **NEVER drop tables without explicit approval**
   - Data loss is irreversible in production
   - Always confirm with project owner first

### 🔒 Security & RLS

4. **NEVER weaken or remove RLS (Row Level Security) policies**
   - RLS is the primary security mechanism
   - Every table MUST have RLS enabled
   - Policies must enforce user/organization isolation
   - Test policies thoroughly before deployment

5. **NEVER bypass RLS with service role key in frontend**
   - Service role bypasses ALL security
   - Only use in Edge Functions with proper validation

6. **ALWAYS validate user input**
   - Use Zod schemas for all forms and API inputs
   - Sanitize data before database operations
   - Validate on both client AND server (Edge Functions)

### 📦 Dependencies & Configuration

7. **NEVER add new dependencies without approval**
   - Document why the dependency is needed
   - Check bundle size impact
   - Verify license compatibility
   - Prefer existing solutions first

8. **NEVER modify CI/CD configuration without approval**
   - Changes can break deployment pipeline
   - Discuss changes before implementation

9. **NEVER commit secrets or API keys**
   - Use `.env` file (git-ignored)
   - Use Supabase secrets for Edge Functions
   - Rotate keys if accidentally committed

### 🎯 Development Workflow

10. **NEVER create large PRs (max 200-300 LOC)**
    - Break features into smaller, reviewable chunks
    - Each PR should have single, clear purpose
    - Exception: Generated code, migrations, dependency updates

11. **ALWAYS create a plan before changing code**
    - Discuss approach with project owner
    - Document expected changes
    - Get approval for significant features

12. **ALWAYS explain technical decisions in simple language**
    - Project owner is non-technical
    - Use analogies and plain language
    - Avoid jargon without explanation

### ⚠️ Code Quality

13. **NEVER disable TypeScript strict mode**
    - Type safety prevents runtime errors
    - Use proper types, not `any`

14. **NEVER ignore ESLint errors without justification**
    - Fix the issue or add documented exception
    - Don't disable rules globally

---

## Coding Standards

### TypeScript
- **Strict mode enabled** - no implicit `any`, strict null checks
- **Explicit return types** for functions (except simple arrow functions)
- **Interfaces over types** for object shapes (types for unions/intersections)
- **Enums** - prefer string literal unions over enums
- **No `any`** - use `unknown` or proper types
- **Type imports** - use `import type` for type-only imports

### React
- **Functional components only** - no class components
- **Hooks** - follow Rules of Hooks
- **Custom hooks** - extract reusable logic to hooks
- **Props interface** - define explicit props interface for each component
- **Destructure props** - destructure in function signature
- **Default exports** - use default exports for page components, named for utilities

### File Organization
- **One component per file** (except tightly coupled sub-components)
- **Co-locate tests** - `ComponentName.test.tsx` next to component
- **Index files** - use for public API of folders
- **Naming conventions:**
  - Components: `PascalCase.tsx`
  - Hooks: `useCamelCase.ts`
  - Utils: `camelCase.ts`
  - Constants: `UPPER_SNAKE_CASE`
  - Types: `PascalCase` (interface/type name)

### Styling
- **Tailwind-first** - use Tailwind utility classes
- **Component variants** - use `class-variance-authority` (cva)
- **shadcn/ui** - extend existing components, don't recreate
- **Responsive design** - mobile-first approach
- **Dark mode** - support dark mode with `next-themes`

### State Management
- **Local state** - `useState` for component-specific state
- **Server state** - TanStack Query for server data
- **Global state** - React Context for app-wide state
- **Forms** - React Hook Form + Zod validation
- **URL state** - React Router for navigation state

### Utilities & Helpers
- **Pure functions** - prefer pure, testable functions
- **Single responsibility** - one function, one purpose
- **Error handling** - explicit error handling, no silent failures
- **Type guards** - use type guards for runtime type checking

---

## Security Standards

### Authentication & Authorization
- **Supabase Auth** - use built-in authentication
- **JWT tokens** - stored in httpOnly cookies (handled by Supabase)
- **Session management** - check auth state on protected routes
- **Role-based access** - implement roles in database, enforce with RLS

### Row Level Security (RLS)
- **Enable RLS on all tables** containing user data
- **Principle of least privilege** - users see only their own data
- **Organization isolation** - users in same org can share data
- **Policy naming convention:**
  ```sql
  -- Format: <table>_<action>_<scope>
  -- Example: projects_select_own_organization
  ```
- **Test RLS policies** - verify policies work as expected

### Input Validation
- **Client-side validation** - Zod schemas for immediate feedback
- **Server-side validation** - ALWAYS validate in Edge Functions
- **SQL injection prevention** - use parameterized queries (Supabase handles this)
- **XSS prevention** - React escapes by default, be careful with `dangerouslySetInnerHTML`

### API Security
- **Rate limiting** - implement in Edge Functions for public endpoints
- **CORS** - configure properly for production domain
- **API keys** - store in Supabase secrets, never in frontend code
- **Webhook signatures** - verify webhook signatures from third parties

### Data Handling
- **Personal data** - handle per GDPR/privacy regulations
- **Data encryption** - use HTTPS (enforced), encrypt sensitive fields if needed
- **Soft deletes** - prefer soft deletes for audit trail
- **Audit logs** - log sensitive operations

### Error Handling
- **No sensitive data in errors** - don't expose stack traces to users
- **Generic error messages** - "Something went wrong" vs. "User email not found in database"
- **Server-side logging** - log detailed errors on server, not client

---

## Testing Standards

### What to Test
- **Business logic** - core algorithms and calculations
- **Utilities** - pure functions and helpers
- **Hooks** - custom React hooks
- **Components** - user interactions, conditional rendering
- **Edge Functions** - API logic, validation, data transformations

### What NOT to Test (Generally)
- **Third-party libraries** - assume they work
- **Trivial code** - getters/setters, simple wrappers
- **UI appearance** - leave to manual testing (for now)

### Testing Patterns
- **Unit tests** - test functions in isolation
- **Integration tests** - test component + hooks + API
- **Test file location** - next to the file being tested
- **Test naming:**
  ```typescript
  describe('ComponentName', () => {
    it('should do something when condition', () => {
      // test
    });
  });
  ```

### Testing Utilities
- **Vitest** - for all tests (unit, integration)
- **Testing Library** - for React components
  - Query priorities: getByRole > getByLabelText > getByText > getByTestId
  - User interactions: `userEvent` library
- **Mock Supabase** - mock Supabase client for tests

### Test Coverage
- **No strict coverage requirements** - focus on critical paths
- **Test before fixing bugs** - reproduce bug in test first
- **Test complex logic** - prioritize testing complex code

---

## Git Workflow

### Branch Naming
- **Feature branches:** `claude/<descriptive-name>-<session-id>`
  - Example: `claude/add-offer-templates-abc123xyz`
- **Session ID suffix** - REQUIRED for Claude Code Web sessions
- **Never push to** `main` or `master` without PR

### Commit Messages
- **Format:** `<type>: <description>`
- **Types:**
  - `feat:` - new feature
  - `fix:` - bug fix
  - `refactor:` - code refactoring (no behavior change)
  - `docs:` - documentation
  - `test:` - add/update tests
  - `chore:` - maintenance (deps, config)
  - `style:` - formatting, whitespace
- **Description:**
  - Use imperative mood: "Add feature" not "Added feature"
  - Be concise but descriptive
  - Reference issue numbers if applicable: `feat: Add offer export (#123)`

### Pull Requests
- **Title:** Clear, descriptive, follows commit convention
- **Description template:**
  ```markdown
  ## Summary
  Brief description of changes

  ## Changes
  - Bullet point list of changes

  ## Testing
  How to test these changes

  ## Screenshots (if UI change)
  [Include screenshots]
  ```
- **Small PRs** - max 200-300 LOC (unless exceptional)
- **Self-review** - review your own PR before requesting review
- **Link issues** - reference related issues

### Code Review
- **Owner reviews all PRs** - wait for approval
- **Respond to feedback** - address all comments
- **Keep PR updated** - rebase or merge main if needed

### Deployment
- **Auto-deploy** - main branch auto-deploys via CI/CD
- **Test before merge** - ensure tests pass
- **Database migrations** - run migrations before deploying code changes

---

## Working with the Non-Technical Owner

### Communication Guidelines

1. **Use plain language**
   - Avoid: "We need to refactor the RLS policies for better query optimization"
   - Better: "We need to update the security rules to make the app faster"

2. **Explain the "why"**
   - Don't just say what you're doing
   - Explain why it matters for the business/users

3. **Provide context**
   - "This change helps users create quotes 30% faster"
   - "This fixes the bug where invoices wouldn't save"

4. **Use analogies**
   - Database = filing cabinet
   - API = waiter taking orders to kitchen
   - Cache = keeping frequently used items on desk

5. **Always ask before risky changes**
   - Database schema changes
   - Removing features
   - Major refactors
   - New paid dependencies

### Decision-Making
- **Owner has final say** on features and priorities
- **You advise** on technical approach and risks
- **Collaborate** on finding best solution
- **Document** decisions and reasoning

### Progress Updates
- **Regular updates** on progress
- **Transparent** about blockers and challenges
- **Estimate** effort (small/medium/large, not hours)
- **Show** working features when possible

---

## Additional Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

### Project-Specific
- Check `/docs` folder for project-specific documentation:
  - **AI_PROVIDERS_REFERENCE.md** - Comprehensive guide to AI provider configuration (OpenAI, Anthropic, Gemini)
- Review recent PRs to understand coding patterns
- Ask owner for domain knowledge (construction industry specifics)

### Recent Development Context
- **Phase 5a** (December 2024) - Offer PDF generation and email delivery system
- **Phase 4** - PDF preview panel improvements and currency formatting
- **Phase 3** - UX improvements and comprehensive upload flow testing
- **Phase 2** - File validation and quote save stability improvements

---

## Quick Reference

### Common Commands
```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run build:dev        # Build in development mode
npm run preview          # Preview production build
npm run lint             # Run ESLint

# Testing
npm test                 # Run tests with Vitest

# Supabase (if running locally)
npx supabase start       # Start local Supabase
npx supabase stop        # Stop local Supabase
npx supabase db reset    # Reset local database
npx supabase functions serve  # Run Edge Functions locally
```

### Environment Variables

#### Frontend Environment Variables (`.env` / Vercel)

Required in `.env` or Vercel Environment Variables:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...  # anon/public key (NOT service_role!)
```

**⚠️ Important:**
- Always use `VITE_` prefix for Vite environment variables
- Use `ANON_KEY` (public key), never `service_role` key in frontend
- These variables are exposed to the browser - no secrets!

#### Backend Environment Variables (Supabase Secrets)

Set in Supabase Dashboard → Edge Functions → Secrets:
```bash
# Auto-injected by Supabase (usually don't need to set manually)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # service_role key (PRIVATE!)

# Required for email sending
RESEND_API_KEY=re_...

# Required for frontend URLs in emails
FRONTEND_URL=https://your-app.vercel.app

# AI Provider (choose ONE)
OPENAI_API_KEY=sk-...           # OpenAI GPT-4
# OR
ANTHROPIC_API_KEY=sk-ant-...    # Anthropic Claude
# OR
GEMINI_API_KEY=AIza...          # Google Gemini (free tier available)
```

**Environment Variable Mapping:**

| Location | Variable Name | Purpose | Secret? |
|----------|--------------|---------|---------|
| Frontend | `VITE_SUPABASE_URL` | Supabase project URL | No |
| Frontend | `VITE_SUPABASE_ANON_KEY` | Public API key | No |
| Edge Functions | `SUPABASE_URL` | Supabase project URL | No |
| Edge Functions | `SUPABASE_SERVICE_ROLE_KEY` | Private admin key | YES |
| Edge Functions | `RESEND_API_KEY` | Email service | YES |
| Edge Functions | `FRONTEND_URL` | Frontend app URL | No |
| Edge Functions | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` | AI provider | YES |

---

## Summary for Claude

When working on this project:

1. ✅ **DO:**
   - Read and understand existing code first
   - Create detailed plans before coding
   - Write small, focused PRs
   - Test your changes
   - Explain decisions in simple language
   - Follow TypeScript and React best practices
   - Maintain security (RLS, validation)
   - Ask before major changes

2. ❌ **DON'T:**
   - Modify existing migrations
   - Rename database tables/columns
   - Weaken RLS policies
   - Add dependencies without approval
   - Create large PRs (>300 LOC)
   - Skip planning step
   - Use technical jargon with owner
   - Commit secrets

3. 🎯 **Remember:**
   - Security is absolute priority
   - Owner is non-technical - communicate clearly
   - Small iterations over big rewrites
   - Test critical paths
   - Document your reasoning

---

## 🏆 Protokół Jakości Enterprise (OBOWIĄZKOWY)

### Zasada 100% + 2× Sprawdzenie

**KAŻDE zadanie musi być:**
1. Wykonane w 100% — bez pominięć, bez "zrobimy później"
2. Sprawdzone dwukrotnie przed zamknięciem — osobny pass code-review

### Obowiązkowa Lista Kontrolna (DoD — Definition of Done)

Przed każdym commitem Claude MUSI potwierdzić każdy punkt:

#### Pass #1 — Weryfikacja implementacji
- [ ] Przeczytałem KAŻDY plik który modyfikuję (przed zmianami)
- [ ] Wszystkie punkty z zadania są zaimplementowane
- [ ] Żadnych hardcoded wartości które powinny być dynamiczne
- [ ] Importy są poprawne (brak nieużywanych, brak brakujących)
- [ ] Komentarze w kodzie są aktualne (nie opisują starego zachowania)
- [ ] Backward compatibility zachowana (stare wywołania działają)
- [ ] Brak niepotrzebnych console.log / debug artefaktów

#### Pass #2 — Weryfikacja kompletności
- [ ] Czy pominąłem jakiś plik z listy "FILES TO MODIFY"?
- [ ] Czy wszystkie edge case'y są obsługiwane?
- [ ] Czy flagi/warunki mają poprawne defaulty (null-safety)?
- [ ] Czy hardcoded wartości zostały zastąpione przez tokeny/zmienne?
- [ ] Sprawdziłem pliki POWIĄZANE (nie tylko bezpośrednio zmienione)
- [ ] Uruchomiłem testy — 0 błędów
- [ ] Uruchomiłem tsc — 0 błędów
- [ ] Uruchomiłem lint — 0 nowych błędów
- [ ] Uruchomiłem build — sukces

#### Pass #3 — Weryfikacja promptu linia po linii (OBOWIĄZKOWY)

> **Ten pass powstał po diagnozie z 2026-04-13:** agent skanuje "sedno" zadania
> i uznaje je za ukończone, pomijając wymagania poboczne wymienione w prompcie
> (logi decyzji, jawna decyzja o feature fladze, format raportu, mandatory output).
> Powtarzało się to w wielu sesjach. Rozwiązanie: fizyczny powrót do promptu po
> wykonaniu kodu i odhaczenie każdego punktu jeden po drugim.

Przed finalizacją (commit / raport końcowy) Claude MUSI wrócić do oryginalnego promptu i sprawdzić każdy punkt:

- [ ] Każde **numerowane wymaganie** (1. 2. 3. …) — czy jest zrealizowane?
- [ ] Każda sekcja **REQUIRED IMPLEMENTATION** — każdy podpunkt oddzielnie
- [ ] Każda sekcja **DOD / Definition of Done** — każdy checkbox oddzielnie
- [ ] Każde **"mandatory output"** / **"paste final line"** — czy jest w raporcie?
- [ ] Każde **"mandatory in output"** (np. Evidence Log, Compatibility Matrix) — czy załączone?
- [ ] Jawna odpowiedź na każde pytanie decyzyjne (np. "użyj flagi / dodaj flagę") — czy odpowiedź jest w raporcie?
- [ ] Pliki dokumentacyjne (DECISIONS.md, ADR, COMPATIBILITY_MATRIX) — czy zaktualizowane?
- [ ] Sekcja **"Agent does / Robert does"** — czy wyraźnie rozdzielona?

**Reguła:** Jeśli jakikolwiek punkt nie jest odhaczony — NIE commituj. Uzupełnij najpierw.
**Antywzorzec do unikania:** "Sedno jest gotowe, reszta to formalności" — formalności są równie obowiązkowe.

#### Raport na końcu zadania
Każde zakończone zadanie MUSI zawierać:
```
## Wyniki weryfikacji
- Testy: X passed, 0 failed
- TypeScript: 0 errors
- Lint: 0 new errors
- Build: ✅ sukces

## Status
- PDF VISUAL SYSTEM COMPLETE / PARTIAL / BLOCKED
- Co zrobiono: [lista]
- Co odroczone: [lista + powód]
- Ryzyka: [lista]
```

### Pułapki Jakościowe — Najczęstsze Błędy

1. **Hardcoded kolory** zamiast tokenów z design systemu
2. **Zdezaktualizowane komentarze** opisujące stare zachowanie
3. **Nieużywane importy** po refaktorze
4. **Pominięte pliki powiązane** (np. zmieniono frontend, zapomniano Deno mirror)
5. **Feature flags bez enforcement** — flagi zdefiniowane ale nie sprawdzane
6. **Fallback bez null-safety** — brak `?? default` przy opcjonalnych polach
7. **Brak testów dla nowego zachowania** (gdy istniejące testy nie pokrywają)
8. **Skanowanie zamiast czytania promptu** — agent uznaje zadanie za skończone po wykonaniu "sedna", pomijając wymagania poboczne (logi decyzji, explicit feature flag decision, mandatory output format). Objaw: Robert musi pytać 2–3 razy zanim wszystko jest kompletne. Lekarstwo: Pass #3 powyżej — fizyczny powrót do promptu i odhaczenie każdego punktu przed commitem.

### Priorytet zadań gdy budżet LOC jest ograniczony
1. Zawsze zrealizuj najpierw zadania o najwyższym wpływie biznesowym
2. Dokumentuj co zostało odroczone i DLACZEGO
3. Nigdy nie zostawiaj kodu w stanie połowicznym — commit tylko kompletnych zmian
4. Jeśli zadanie jest za duże na 1 PR — podziel je i zaznacz wyraźnie granicę

---

## 🔒 Protokół Gwarancji Kompletności (OBOWIĄZKOWY — nadrzędny)

> **Geneza:** Ten protokół powstał po wielokrotnym powtarzaniu się wzorca:
> agent deklaruje "wszystko zrobione", a przy ponownym sprawdzeniu okazuje się,
> że wiele elementów jest pominiętych, niedopracowanych lub odłożonych bez
> wyraźnego zaznaczenia. Istniejące Passy #1–#3 nie były wystarczające,
> ponieważ brakowało mechanizmów WYMUSZAJĄCYCH ich faktyczne wykonanie.
> Ten protokół jest warstwą enforcement — konkretne reguły, które eliminują
> każdą ścieżkę do "fałszywego sukcesu".
>
> **Relacja Faz do Passów:** Passy #1–#3 (z Protokołu Jakości Enterprise) to **checklista** — CO sprawdzić.
> Fazy 0–3 (ten protokół) to **enforcement** — JAK wymusić, żeby te checklist zostały faktycznie wykonane.
> Fazy nie zastępują Passów — Fazy wymuszają ich realizację. Agent MUSI wykonać OBA: Passy (checklist)
> W RAMACH Faz (enforcement).

### Faza 0: Dekompozycja promptu (PRZED jakimkolwiek kodem)

Patrz sekcja "Obowiązkowy Start Sesji" powyżej. Faza 0 = warunek konieczny.

**Dodatkowe reguły Fazy 0:**
- Jeśli prompt ma >5 wymagań i agent NIE użył TodoWrite — to jest błąd proceduralny, praca jest nieważna
- Agent NIE MOŻE "scalać" wymagań (np. "punkty 3–7 to jedno todo") — każdy punkt to OSOBNE todo
- Agent NIE MOŻE usuwać punktów z todo — może tylko oznaczać jako done (z dowodem) lub blocked (z powodem)
- Jeśli agent odkryje w trakcie pracy NOWE wymaganie (nie z promptu) — dodaje je do todo z etykietą `[DISCOVERED]` i pyta użytkownika czy realizować

### Faza 1: Praca z ciągłym śledzeniem

Podczas pracy agent MUSI:

1. **Oznaczać każde todo jako "done" NATYCHMIAST po jego realizacji** — nie batchować na koniec
2. **Przy każdym oznaczeniu podać dowód:** `plik:linia` lub wynik komendy — NIE "zrobione" bez dowodu
3. **Co ~50% postępu (lub co 5 zrealizowanych punktów)** — CHECKPOINT:
   - Wrócić do listy todo i sprawdzić: ile done, ile remaining?
   - Czy nie "dryfuję" od wymagań? Czy nie rozwiązuję problemu, którego nie było w prompcie?
   - Czy żaden punkt nie został pominięty lub "cicho usunięty"?
   - Raport checkpointu do użytkownika: "Postęp: X/Y punktów done, remaining: [lista]"
4. **Reguła Edit → Read → Verify:** Po KAŻDEJ edycji pliku (Edit lub Write):
   - Przeczytać zmieniony fragment (Read) — minimum 10 linii kontekstu wokół zmiany
   - Sprawdzić: poprawność składni, brak duplikatów importów, zamknięte nawiasy, prawidłowe wcięcia
   - Jeśli plik ma importy — sprawdzić duplikaty i czy nowy import jest faktycznie potrzebny
5. **Jeśli wymaganie jest niejasne** — STOP, użyj AskUserQuestion z formatem:
   ```
   ❓ Niejasne wymaganie: [cytuj dokładne wymaganie z promptu]
   Moja interpretacja: [jak to rozumiem]
   Alternatywa: [inna możliwa interpretacja]
   Pytanie: Która interpretacja jest poprawna?
   ```
   **ZAKAZ:** Agent NIE MOŻE sam "interpretować" niejasnego wymagania i realizować swoją interpretację bez pytania.

### Faza 2: Weryfikacja techniczna (OBOWIĄZKOWA sekwencja)

Po zakończeniu WSZYSTKICH punktów z todo, agent MUSI wykonać w tej kolejności:

1. `npm run lint` → 0 nowych błędów
2. `npx tsc --noEmit` → 0 błędów
3. `npm test` → 0 failed
4. `npm run build` → sukces
5. `git diff` → przejrzeć KAŻDĄ zmienioną linię i uzasadnić jej istnienie

**Jeśli którykolwiek krok fail:** napraw → powtórz CAŁĄ sekwencję od kroku 1.
**NIE przechodź dalej jeśli jest choćby 1 fail.**
**NIE commituj z komentarzem "lint/test do poprawki" — najpierw popraw, potem commituj.**

### Faza 3: Wymuszona pauza i weryfikacja kompletności

**ZANIM agent napisze raport końcowy lub zcommituje, MUSI wykonać WYMUSZONY STOP:**

1. **Otworzyć oryginalny prompt** (przewinąć do niego w konwersacji)
2. **Przejść KAŻDY punkt z promptu linia po linii** i dla KAŻDEGO wypisać:
   ```
   Wymaganie: [cytuj dosłownie]
   Status: ✅ DONE | ❌ NOT DONE | ⚠️ PARTIAL
   Dowód: [plik:linia | wynik komendy | output testu]
   ```
   - ✅ DONE — wymaga konkretnego dowodu (plik:linia, output). "Zrobiłem to" BEZ dowodu = ❌
   - ❌ NOT DONE — wymaga powodu DLACZEGO i planu KIEDY
   - ⚠️ PARTIAL — ZABRONIONE. Albo jest zrobione w 100%, albo nie jest zrobione. Brak "częściowo".
3. **Sprawdzić listę TodoWrite** — czy KAŻDY punkt jest oznaczony? Czy nie ma "zapomnianego" todo?
4. **Sprawdzić pliki POWIĄZANE** — czy zmiana w pliku A nie wymaga aktualizacji pliku B?
5. **Jeśli JAKIKOLWIEK punkt jest ❌** — napraw TERAZ, a nie "w następnej sesji"
6. **Jeśli naprawdę NIE DA SIĘ naprawić** — eskaluj do użytkownika przez AskUserQuestion z DOKŁADNYM powodem

### Zakazane frazy i wzorce (HARD BLOCK)

Agent NIE MOŻE używać poniższych fraz. Ich użycie oznacza, że praca NIE jest skończona:

| Zakazana fraza | Dlaczego zakazana | Co agent MUSI zrobić zamiast tego |
|---------------|-------------------|----------------------------------|
| "Wszystko zrobione" / "Gotowe" | Brak dowodu per-punkt | Wypisz KAŻDY punkt z dowodem |
| "Prawie gotowe" | Maskuje braki | Wypisz CO KONKRETNIE nie jest gotowe i ZRÓB TO |
| "Drobne poprawki do zrobienia" | Bagatelizuje braki | Wypisz JAKIE poprawki i ZRÓB JE TERAZ |
| "Reszta to formalności" | Formalności są obowiązkowe | Wykonaj "formalności" TERAZ |
| "W następnej sesji / później" | Odkładanie bez zgody | Zrób TERAZ lub eskaluj JAWNIE przez AskUserQuestion |
| "Powinno działać" | Brak faktycznej weryfikacji | Udowodnij: uruchom test, build, pokaż output |
| "Wygląda dobrze" | Subiektywna ocena | Podaj OBIEKTYWNY dowód: test pass, build success |
| "Zasadniczo kompletne" | 95% ≠ 100% | Wypisz brakujące 5% i ZRÓB JE |
| "Nie powinno to wpłynąć na..." | Zgadywanie zamiast weryfikacji | Zweryfikuj FAKTYCZNIE: uruchom testy powiązane |
| "Zakładam że..." | Narusza zasadę #4 "Nie zgaduj" | STOP, zweryfikuj lub zapytaj użytkownika |
| "To minor issue" | Minimalizowanie problemu | Opisz problem i napraw albo eskaluj |

### Reguła atomowego commita

**Definicja kompletnej zmiany:**
- 100% wymagań z promptu jest zrealizowanych, LUB
- Agent JAWNIE eskalował do użytkownika listę tego, czego NIE DA SIĘ zrealizować
  w tej sesji, z podaniem POWODU dla KAŻDEGO punktu, i użytkownik POTWIERDZIŁ
  że to akceptowalne

**Twarde zakazy:**
- Agent NIE MOŻE sam zdecydować, że coś "odłoży na później" — każde odroczenie wymaga jawnej zgody użytkownika
- Agent NIE MOŻE commitować z wiedzą o nierozwiązanych problemach bez poinformowania użytkownika
- Agent NIE MOŻE usunąć wymagania z listy todo bez realizacji lub eskalacji
- Agent NIE MOŻE zmienić treści wymagania w todo (np. uprościć je żeby było łatwiej odhaczyć)

### Reguła "Weryfikuj output, nie intencję"

Agent ma naturalną tendencję do sprawdzania czy **zamierzał** zrobić poprawnie,
zamiast sprawdzenia czy **wynik** jest poprawny. Ta reguła to eliminuje:

- Po edycji → Read zmienionego pliku (nie "wiem co napisałem")
- Po dodaniu importu → sprawdź że nie ma duplikatu (nie "na pewno nie ma")
- Po zmianie logiki → uruchom test (nie "logika wygląda ok")
- Po build → sprawdź output (nie "build pewnie przeszedł")
- Po commicie → git status/log (nie "commit pewnie się udał")

**Zasada:** Każde twierdzenie o stanie kodu MUSI być poparte wynikiem komendy, NIE intencją agenta.

### Reguła anty-dryfowania

Podczas pracy agent może "dryfować" — zacząć naprawiać rzeczy, których nie było w prompcie,
refaktoryzować pobocznie, dodawać "ulepszenia". To powoduje:
- Rozszerzenie zakresu (narusza zasadę #5)
- Utratę fokusa na wymaganiach z promptu
- Poczucie "zrobiłem dużo" mimo niezrealizowanych wymagań

**Reguła:** Przed KAŻDĄ zmianą agent MUSI odpowiedzieć na pytanie:
"Które KONKRETNE wymaganie z promptu realizuję tą zmianą?"
Jeśli odpowiedź to "żadne, ale to poprawi..." → NIE RÓB TEJ ZMIANY.

### Reguła "Last mile" — ostatnie 10% jest krytyczne

> **Wzorzec problemu:** Agent realizuje 90% wymagań szybko, potem "deklaruje sukces"
> bo czuje że "prawie wszystko jest zrobione". Brakujące 10% to zwykle:
> Evidence Log, raport końcowy, aktualizacja dokumentacji, explicit odpowiedzi na pytania decyzyjne.

**Reguła:** Agent NIE MOŻE zacząć pisać raportu końcowego dopóki lista TodoWrite
nie pokazuje 100% punktów jako "done". Raport jest OSTATNIĄ rzeczą, nie pierwszą po kodzie.

**Sekwencja zamknięcia (OBOWIĄZKOWA):**
1. Wszystkie todo = done (z dowodami)
2. Faza 2 (lint/tsc/test/build) = pass
3. Faza 3 (weryfikacja per-punkt) = pass
4. Evidence Log = wypełniony
5. Sekcja "Agent does / Robert does" = wyraźnie rozdzielona
6. Dopiero TERAZ → raport końcowy
7. Dopiero TERAZ → commit

### Reguła ciągłości między sesjami

Jeśli zadanie jest kontynuowane w nowej sesji:

1. Agent MUSI przeczytać CLAUDE.md (mogło się zmienić)
2. Agent MUSI odtworzyć kontekst: co było zrobione, co nie, jakie były blokery
3. Agent MUSI zrekonstruować listę TodoWrite z poprzedniej sesji
4. Agent NIE MOŻE założyć, że "poprzednia sesja zrobiła X dobrze" — MUSI zweryfikować
5. Agent MUSI poinformować użytkownika o swoim rozumieniu stanu i zapytać o potwierdzenie

### Reguła self-audit odpowiedzi

> **Wzorzec problemu:** Agent pisze "dodałem X, Y i Z" ale w rzeczywistości dodał
> tylko X i Y. Agent nie rewiduje swojej własnej odpowiedzi przed wysłaniem,
> przez co użytkownik dostaje fałszywe informacje o stanie pracy.

**Reguła:** Przed wysłaniem KAŻDEJ odpowiedzi zawierającej twierdzenia o wykonanej pracy,
agent MUSI:

1. Przeczytać swoją odpowiedź jeszcze raz od początku do końca
2. Dla KAŻDEGO twierdzenia ("dodałem X", "zmieniłem Y", "naprawiłem Z") — zweryfikować,
   że to FAKTYCZNIE zostało zrobione (Read pliku, git diff, output komendy)
3. Jeśli jakiekolwiek twierdzenie jest fałszywe — usunąć je lub naprawić ZANIM wyśle odpowiedź
4. Nie używać liczby mnogiej dla pojedynczych zmian ("poprawiłem kilka rzeczy" gdy poprawił jedną)

**Antywzorzec:** "Dodałem obsługę X, Y i Z" → w rzeczywistości dodał X, zaczął Y, zapomniał o Z.
**Prawidłowo:** Zweryfikuj każdy punkt, potem dopiero napisz co zrobiłeś.

### Reguła "Sprawdź wszystkie call-sites" (impact analysis)

> **Wzorzec problemu:** Agent zmienia sygnaturę funkcji/komponentu w jednym pliku,
> ale nie sprawdza WSZYSTKICH miejsc gdzie ta funkcja/komponent jest używany.
> Rezultat: build przechodzi (bo TypeScript wykryje), ale jeśli zmiana jest w typach
> opcjonalnych lub w zachowaniu — nikt nie zauważy do produkcji.

**Reguła:** Kiedy agent modyfikuje:
- **Sygnaturę funkcji/hooka** (parametry, return type) → `Grep` po nazwie funkcji w całym projekcie
- **Props komponentu** (dodaje, usuwa, zmienia typ) → `Grep` po nazwie komponentu w całym projekcie
- **Strukturę typu/interfejsu** → `Grep` po nazwie typu w całym projekcie
- **Eksport z modułu** → `Grep` po ścieżce importu w całym projekcie
- **Nazwę pliku** → `Grep` po starej ścieżce w całym projekcie

Dla KAŻDEGO znalezionego call-site agent MUSI:
1. Przeczytać kontekst użycia (Read)
2. Ocenić czy zmiana wymaga aktualizacji w tym miejscu
3. Jeśli tak — zaktualizować
4. Jeśli nie — udokumentować DLACZEGO nie wymaga

**ZAKAZ:** Agent NIE MOŻE zmienić interfejsu/sygnatury bez wykonania `Grep` po nazwie.

### Reguła "Nie kopiuj bez weryfikacji kontekstu"

> **Wzorzec problemu:** Agent kopiuje fragment kodu z jednego pliku do drugiego
> (np. wzorzec użycia hooka, fragment JSX, logikę walidacji). Kopiowany kod
> zawiera importy, zmienne i zależności specyficzne dla ORYGINALNEGO pliku,
> które nie istnieją w DOCELOWYM pliku. Rezultat: błędy kompilacji lub runtime.

**Reguła:** Kiedy agent kopiuje kod z pliku A do pliku B, MUSI:

1. Sprawdzić KAŻDY import/zależność w kopiowanym fragmencie:
   - Czy import istnieje w pliku B? Jeśli nie → dodaj
   - Czy ścieżka importu jest poprawna z perspektywy pliku B? (relatywne ścieżki się zmieniają!)
2. Sprawdzić KAŻDĄ zmienną/stan w kopiowanym fragmencie:
   - Czy zmienna istnieje w kontekście pliku B?
   - Czy hook jest dostępny w kontekście pliku B?
3. Sprawdzić KAŻDY typ:
   - Czy typy użyte w fragmencie są importowane w pliku B?
4. Po wklejeniu — Read pliku B i zweryfikować że się kompiluje (`npx tsc --noEmit`)

**ZAKAZ:** Agent NIE MOŻE kopiować kodu metoda "kopiuj-wklej i mam nadzieję że działa".
Każdy skopiowany fragment wymaga adaptacji do kontekstu docelowego pliku.

---

**This document is your guide to working effectively on Majster.AI. When in doubt, ask the owner!**
