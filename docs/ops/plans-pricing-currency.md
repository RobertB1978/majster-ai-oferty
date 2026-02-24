# Plans, Pricing & Currency — Operational Reference

## Single Source of Truth

All plan prices live in one file:

```
src/config/plans.ts
```

**Do not define prices anywhere else.** If you need to display a plan price in a component, import from this file.

## Canonical Prices (PLN, net)

| id         | slug       | PLN/mies. | EUR/mies. (~) |
|------------|------------|-----------|---------------|
| `free`     | `darmowy`  | 0         | —             |
| `pro`      | `pro`      | 49        | €11           |
| `business` | `biznes`   | 99        | €23           |
| `enterprise`| `enterprise`| 199     | €46           |

EUR values are approximate (computed at runtime using `VITE_PLN_EUR_RATE`).

## Currency Display Format

Dual-currency display is mandatory on all pricing UI, in every locale.

| Locale | Format example        |
|--------|-----------------------|
| PL     | `49 zł • €11`         |
| EN     | `€11 • 49 PLN`        |
| UK     | `€11 • 49 PLN`        |

Implementation: `src/config/currency.ts` → `formatDualCurrency(pricePLN, lang)`.

## Environment Variable

```
VITE_PLN_EUR_RATE=0.23
```

- Set in `.env` (local) or Vercel environment variables.
- Defaults to `0.23` if not set (see `DEFAULT_PLN_EUR_RATE` in `currency.ts`).
- EUR price = `Math.round(pricePLN * rate)`.

## Components That Use Plans

| File | How it consumes |
|------|----------------|
| `src/pages/Plany.tsx` | imports `PLANS` from `@/config/plans` |
| `src/pages/PlanyDetail.tsx` | imports `PLANS` via re-export from `Plany.tsx` |
| `src/pages/Billing.tsx` | imports `PLANS` from `@/config/plans` |
| `src/components/billing/PricingPlans.tsx` | imports `getPlanById()` from `@/config/plans` |
| `src/pages/Plan.tsx` | reads `tier.pricePLN` from `ConfigContext` (prices match canonical) |

## `PlanConfig` Type Structure

```typescript
interface PlanConfig {
  slug: string;             // URL slug (e.g. 'biznes')
  id: string;               // Internal id (e.g. 'business')
  displayNameKey: string;   // i18n key, e.g. 'billing.plans.business.name'
  descriptionKey: string;   // i18n key
  featuresKeys: string[];   // i18n keys for feature list
  name: string;             // Fallback Polish name
  description: string;      // Fallback Polish description
  features: string[];       // Fallback Polish feature strings
  limits: PlanLimits;       // maxProjects, maxClients, maxTeamMembers, maxStorageMB
  pricePLN: number;         // Canonical price in PLN
  highlighted: boolean;     // Whether to show "Most popular" badge
  stripePriceId: string | null;  // null until Stripe is configured
  faq: Array<{ q: string; a: string }>;
}
```

## How to Change a Price

1. Edit `pricePLN` in `src/config/plans.ts`.
2. All pages and components pick up the change automatically.
3. Update the table above in this document.
4. If Stripe is configured, also update `stripePriceId` and the Stripe dashboard.

## Tests

```bash
npx vitest run src/test/features/plans-currency.test.ts
```

Tests assert:
- Pro price is 49 PLN.
- Biznes price is 99 PLN.
- Enterprise price is 199 PLN.
- `formatDualCurrency(49, 'pl')` returns `'49 zł • €11'`.
- `formatDualCurrency(49, 'en')` returns `'€11 • 49 PLN'`.
- All plans have required typed fields including `limits` and `stripePriceId`.
