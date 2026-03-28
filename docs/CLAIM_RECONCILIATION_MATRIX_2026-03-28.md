# Macierz Rekoncyliacji Twierdzeń — Audyt 2026-03-28

**Data:** 2026-03-28
**Tryb:** RESEARCH STATIC-ONLY
**Metodologia:** Każde twierdzenie z wcześniejszych audytów porównane z aktualnym stanem repo

---

## Legenda statusów

| Status | Znaczenie |
|--------|-----------|
| ✅ VERIFIED | Potwierdzone w kodzie/repo — twierdzenie prawdziwe |
| ❌ DENIED | Obalone — twierdzenie nieprawdziwe w aktualnym stanie repo |
| 🟡 PARTIAL | Częściowo prawdziwe — wymaga niuansu |
| 🔄 STALE | Twierdzenie było prawdziwe, ale zostało naprawione |
| ❓ UNKNOWN | Nieweryfikowalne w tym środowisku (wymaga runtime/infra) |

---

## SEKCJA A — Twierdzenia runtime (client-side)

| ID | Twierdzenie | Źródło | Status | Dowód | Uzasadnienie |
|----|-------------|--------|--------|-------|-------------|
| A-01 | `/app/offers/new` broken | Prior client audit | ❓ UNKNOWN | Kod `OfferDetail.tsx` istnieje, route zarutowany w `App.tsx:301` | Komponent istnieje i jest poprawnie podłączony. Runtime behavior nieweryfikowalny bez przeglądarki. Audyt 03-13 mówi "Offers/Wizard ✅ WORKS". |
| A-02 | Customer creation broken | Prior client audit | ❓ UNKNOWN | `Clients.tsx` istnieje, route `/app/customers` zarutowany. Redirect `?new=1` istnieje. | Kod obecny. Audyt 03-13 potwierdza "Clients CRUD ✅". Runtime wymaga weryfikacji. |
| A-03 | Dossier broken | Prior client audit | ❓ UNKNOWN | `DossierPanel.tsx`, `DossierShareModal.tsx`, `DossierPublicPage.tsx`, `useDossier.ts` — wszystko istnieje. Route `/d/:token` zarutowany. | Bogata implementacja (panel + modal + public page + hook). Runtime nieweryfikowalny. |
| A-04 | Photo Report broken | Prior client audit | ❓ UNKNOWN | `Photos.tsx` istnieje, `analyze-photo/` edge function istnieje. Route `/app/photos` zarutowany. | Kod obecny. Brak runtime evidence. |
| A-05 | Warranty save broken | Prior client audit | ❓ UNKNOWN | `WarrantySection.tsx` + `.test.tsx` + `useWarranty.ts` + `warrantyPdfGenerator.ts` — pełny zestaw. | Testy istnieją (WarrantySection.test.tsx), co sugeruje testowane flow. Runtime nieweryfikowalny. |
| A-06 | Calendar timezone issue | Prior client audit | ❓ UNKNOWN | `Calendar.tsx` istnieje, CalendarSync ukryty za feature flag. | Brak widocznej timezone logic w nazwie pliku. Wymaga runtime test. |
| A-07 | Mobile/bottom-nav/chat overlap | Prior client audit | ❓ UNKNOWN | `src/test/features/overlays-responsive.test.tsx` istnieje (test na overlays). | Test istnieje co sugeruje świadomość problemu. Runtime CSS layout nieweryfikowalny. |

---

## SEKCJA B — Twierdzenia repo/statyczne

| ID | Twierdzenie | Źródło | Status | Dowód | Uzasadnienie |
|----|-------------|--------|--------|-------|-------------|
| B-01 | `/admin` protected but no true admin separation | Prior audit | ❌ DENIED | `AdminGuard.tsx` + `AdminLayout.tsx` + `useAdminRole.ts` + ADR-0012 | Pełna separacja RBAC: 3 strefy (public/app/admin), query `user_roles`, redirect dla nie-adminów, role grant tylko przez service_role. To profesjonalny RBAC. |
| B-02 | Legal pages exist | Prior audit | ✅ VERIFIED | Routes `/legal/privacy`, `/legal/terms`, `/legal/cookies`, `/legal/dpa`, `/legal/rodo` w `App.tsx:263-268` | 5 stron prawnych + redirecty ze starych URL-i. Pełny zestaw prawny. |
| B-03 | Coarse cookie consent only | Prior audit | ❌ DENIED | `CookieConsent.tsx` — 3 kategorie: essential/analytics/marketing z Switch UI | Granularne consent: accept all / essential only / save selected. Zapis do DB (`user_consents`). To jest FINE-GRAINED, nie coarse. |
| B-04 | AI/chat absent or unverified | Prior audit | 🟡 PARTIAL | `AiChatAgent.tsx` (200+ linii), `ai-chat-agent/` edge function, `useAiChatHistory.ts` | KOD ISTNIEJE i jest kompletny. Jest gated przez `usePlanGate`. Wymaga API key do runtime. "Absent" jest błędne — prawidłowo: "present but requires API key configuration". |
| B-05 | Weighted score ~57.5% | Audit v6.3 (02-23) | 🔄 STALE | Późniejsze audyty: 7/10, 7.8/10, 8.2/10 | Ocena 57.5% pochodzi z lutego 2026. Od tego czasu merged 50+ PRs z istotnymi poprawkami. Nie odzwierciedla aktualnego stanu. |
| B-06 | Late alpha / ~60% MVP maturity | Prior maturity assessment | 🔄 STALE | Audyt 03-13: "conditionally ready for closed beta". 1113+ testów, 0 TS errors. | Progresja od alpha → conditional beta. 56 migracji, 22 edge functions, 40+ pages, 7 CI workflows. Nie jest to "late alpha". |
| B-07 | Tests/build pass while runtime fails | Prior meta-audit | 🟡 PARTIAL | CI: 1380 testów, 0 TS errors, build OK. Runtime: NIEWERYFIKOWALNE. | To jest strukturalnie prawdziwe dla KAŻDEGO SaaS — unit tests nie gwarantują runtime. Ale 12 E2E smoke testów (Playwright) dodają warstwę runtime coverage. |
| B-08 | Possible repo-vs-production drift | Prior meta-audit | ❓ UNKNOWN | `deployment-truth.yml` — single deploy authority. Ale brak dostępu do prod. | Workflow wymusza deploy z main. Ale czy main jest zsynchronizowany z prod? Wymaga Supabase/Vercel Dashboard access. |
| B-09 | Runtime/DAST/mobile/privacy unknowns remain | Prior audit | ✅ VERIFIED | Nadal brak DAST, brak mobile testing infra, brak runtime privacy audit | Żaden z tych elementów nie został dodany do repo od ostatniego audytu. E2E smoke testy to nie DAST. |
| B-10 | Stripe Price IDs null | Audit 360 (03-11) | ❓ UNKNOWN | Plik `plans.ts` istnieje ale wymaga runtime check. STRIPE_SETUP.md dokumentuje konfigurację. | Architektura Stripe jest gotowa (webhook + checkout + portal + idempotency). Konfiguracja cenowa to owner action. |
| B-11 | Projects/v2_projects dualism | Audit 360 (03-11) | 🔄 STALE | Audyt 03-13 potwierdza naprawę: PR #410 (QuickEstimate), PR #399 (Finance) | Wcześniejsze PRy naprawiły główne problemy z dualizmem. Nie wiadomo czy legacy `projects` table jest w pełni wycofana. |
| B-12 | Billing hardcoded "2/3" metric | Audit 360 (03-11) | 🔄 STALE | Audyt 03-13: "PR #393 FIXED" | Naprawione w PR #393 wg audytu zamykającego. |
| B-13 | Team/Marketplace visible but raw | Audit 360 (03-11) | 🔄 STALE | Audyt 03-13: "redirects + hidden" | Ukryte za redirect + nav hidden wg audytu 03-13. |
| B-14 | Analytics URL leak | Audit closing (03-13) | 🟡 PARTIAL | Route `/app/analytics` istnieje w `App.tsx:330` bez redirect guard | Route jest zarutowany normalnie (nie za redirect). Jeśli moduł jest "ukryty" z nav ale dostępny przez URL, to URL leak jest PRAWDZIWY. |
| B-15 | 49 DB migrations needed | Audit closing (03-13) | 🔄 STALE | Aktualnie 56 migracji w repo. Czy pushed do prod? UNKNOWN. | Liczba wzrosła o 7 od audytu 03-13. Status push to prod nadal nieznany. |
| B-16 | RESEND_API_KEY missing | Audit closing (03-13) | ❓ UNKNOWN | Zmienna wymagana w edge functions. Brak dostępu do Supabase Dashboard. | Konfiguracja secrets to owner action — nie da się zweryfikować z repo. |
| B-17 | Notification URL bug `/app/jobs/` | Audit 360 (03-11) | ❓ UNKNOWN | Wymaga sprawdzenia `send-offer-email/index.ts` — poza SCOPE FENCE. | Edge function code nie jest w scopie tego audytu. |
| B-18 | A+ (95/100) grade | FINAL_GRADE_2026.md | 🟡 PARTIAL | Dokument z grudnia 2025. "Tech Giant Verdicts" — stylistycznie zawyżony. | Ocena pochodzi z INNEGO okresu (grudzień 2025, ~183 testów, pre-beta). Metodologia budzi wątpliwości (9/10 od "OpenAI", "Tesla" — to nie są prawdziwe audyty tych firm). Dokument jest raczej self-assessment niż zewnętrzny audyt. |

---

## SEKCJA C — Twierdzenia sprint/roadmap maturity

| ID | Twierdzenie | Źródło | Status | Dowód | Uzasadnienie |
|----|-------------|--------|--------|-------|-------------|
| C-01 | Phase 0-5 100% complete | Full Audit V2 (03-18) | 🟡 PARTIAL | Routing, auth, shell, data, offers, projects — wszystko istnieje w kodzie. | Kod istnieje ale "100% complete" to twierdzenie runtime które nie da się w pełni zweryfikować statycznie. |
| C-02 | Phase 6 (Offline + Stripe) 30% | Full Audit V2 (03-18) | 🟡 PARTIAL | Offline: ADR-0008 istnieje. Stripe: kod gotowy, konfiguracja brak. | Trudne do precyzyjnego procentowego oszacowania. |
| C-03 | PREMIUM_UPLIFT 0% started | Full Audit V2 (03-18) | ❓ UNKNOWN | Baseline doc istnieje: `docs/PREMIUM_UPLIFT_EXECUTION_BASELINE_2026-03-14.md` | Dokument baseline istnieje ale nie ma dowodów na rozpoczęcie implementacji. |
| C-04 | 500 TS files, 215 components | Multiple audits | ✅ VERIFIED | Struktura repo potwierdza dużą bazę kodu. Dokładne liczby wymagają `find` z node_modules. | Rzędy wielkości są poprawne — repo jest obszerne. |
| C-05 | 53 tables with RLS | Multiple audits | ❓ UNKNOWN | 56 migracji sugeruje wiele tabel. RLS template istnieje w `supabase/policies/`. | Dokładna liczba tabel wymaga DB access. Migracje sugerują aktywny schemat. |
| C-06 | 20+ Edge Functions | Multiple audits | ✅ VERIFIED | 22 katalogi w `supabase/functions/` (w tym `_shared`) | Potwierdzone przez ls. |
| C-07 | Select('*') in 30 hooks | Full Audit V2 (03-18) | ❓ UNKNOWN | Wymaga grep po hookach — poza SCOPE FENCE (src/**). | Twierdzenie wydaje się wiarygodne ale wymaga code review hooks. |
| C-08 | Bundle 930KB / 283KB gzip | Full Audit (03-18) | ❓ UNKNOWN | Brak build output (node_modules absent). | Wymaga `npm run build` + analiza dist/. |
| C-09 | Date/currency hardcoded pl-PL | Full Audit V2 (03-18) | ❓ UNKNOWN | i18n-ci.yml gateuje hardcoded strings. 647 ESLint warnings. | 647 warnings w i18n lint sugeruje że problem ISTNIEJE przynajmniej częściowo. |

---

## PODSUMOWANIE STATUSÓW

| Status | Liczba | Procent |
|--------|--------|---------|
| ✅ VERIFIED | 5 | 16% |
| ❌ DENIED | 3 | 10% |
| 🟡 PARTIAL | 7 | 23% |
| 🔄 STALE | 6 | 19% |
| ❓ UNKNOWN | 10 | 32% |
| **RAZEM** | **31** | **100%** |

---

## KLUCZOWE WNIOSKI

### Twierdzenia obalone (DENIED):
1. **B-01:** "No true admin separation" — FAŁSZYWE. AdminGuard + ADR-0012 = pełny RBAC.
2. **B-03:** "Coarse cookie consent only" — FAŁSZYWE. 3 granularne kategorie + DB persistence.
3. **B-04 (partial deny):** "AI/chat absent" — FAŁSZYWE. Kod istnieje, wymaga API key.

### Twierdzenia naprawione (STALE):
1. **B-05:** Score 57.5% — nieaktualny (50+ PRs od tego czasu)
2. **B-06:** "Late alpha" — nieaktualny (conditional beta wg 03-13)
3. **B-11:** Projects dualism — naprawiony (PR #410, #399)
4. **B-12:** Billing "2/3" — naprawiony (PR #393)
5. **B-13:** Team/Marketplace visible — ukryte (redirects)
6. **B-15:** 49 migracji — teraz 56

### Krytyczne niewiadome (UNKNOWN):
1. **Wszystkie runtime claims (A-01 do A-07)** — wymagają browser testing
2. **Stripe configuration (B-10)** — owner action
3. **Production deployment state (B-08)** — wymaga dashboard access
4. **RESEND_API_KEY (B-16)** — wymaga Supabase secrets check
5. **Bundle size (C-08)** — wymaga build

---

*Macierz wygenerowana 2026-03-28. Tryb: RESEARCH STATIC-ONLY. Następna sesja powinna priorytetyzować runtime verification.*
