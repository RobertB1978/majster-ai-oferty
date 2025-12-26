# CLAUDE.md

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

**This document is your guide to working effectively on Majster.AI. When in doubt, ask the owner!**
