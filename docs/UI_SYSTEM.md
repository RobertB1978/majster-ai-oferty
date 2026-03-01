# UI System — Majster.AI Design Foundation

> PR-03 · branch `claude/design-system-ui-states-ufHHS` · 2026-03-01

---

## 1. Design Tokens

All design tokens live as **CSS custom properties** (variables) in `src/index.css`.
Tailwind utilities reference these variables through `tailwind.config.ts`.

### Color tokens (HSL)

| Token | Light value | Dark value | Usage |
|-------|-------------|------------|-------|
| `--background` | 210 20% 98% | 222 47% 8% | Page background |
| `--foreground` | 222 47% 11% | 210 40% 98% | Body text |
| `--primary` | 30 90% 32% (deep amber) | 38 92% 55% (safety amber) | Actions, buttons |
| `--secondary` | 215 16% 94% | 217 30% 20% | Secondary surfaces |
| `--muted` | 220 14% 92% | 222 30% 16% | Disabled, subtle BG |
| `--muted-foreground` | 220 9% 46% | 215 20% 55% | Placeholder, captions |
| `--destructive` | 0 84% 60% | 0 72% 55% | Error, delete actions |
| `--success` | 152 76% 36% | 152 70% 42% | Success states |
| `--warning` | 38 92% 44% | 38 92% 55% | Warning states |
| `--info` | 199 89% 48% | 199 89% 55% | Informational states |
| `--border` | 220 13% 87% | 222 25% 22% | Borders, dividers |
| `--ring` | same as primary | same as primary | Focus rings |

### Usage in components

```tsx
// via Tailwind utility (preferred)
<div className="bg-background text-foreground border-border" />
<p className="text-muted-foreground" />
<span className="text-destructive" />

// via CSS variable (only when Tailwind class unavailable)
style={{ color: 'hsl(var(--primary))' }}
```

### Shadow scale

| Token | Usage |
|-------|-------|
| `shadow-sm` / `var(--shadow-sm)` | Subtle card elevation |
| `shadow-md` | Hover state, dropdowns |
| `shadow-lg` | Modals, sheets |
| `shadow-card` | Default card |
| `shadow-card-hover` | Card on hover |

### Border radius

| Class | Value |
|-------|-------|
| `rounded-sm` | `calc(var(--radius) - 4px)` |
| `rounded-md` | `calc(var(--radius) - 2px)` |
| `rounded-lg` | `var(--radius)` = 0.5rem |
| `rounded-xl` | `calc(var(--radius) + 4px)` |
| `rounded-2xl` | `calc(var(--radius) + 8px)` |

---

## 2. Icons

**Library:** [Lucide React](https://lucide.dev) · `lucide-react` — the only icon library in use.

### Icon sizing convention

| Size class | px | When to use |
|------------|----|-------------|
| `h-4 w-4` | 16 | Inside buttons, badges, small inline indicators |
| `h-5 w-5` | 20 | Form labels, table cells |
| `h-6 w-6` | 24 | Section headers, card icons |
| `h-8 w-8` | 32 | Empty state icons (in `.icon-container`) |

### Icon states

```tsx
// Active / default
<FileText className="h-5 w-5 text-foreground" />

// Muted / secondary
<FileText className="h-5 w-5 text-muted-foreground" />

// Primary accent
<FileText className="h-5 w-5 text-primary" />

// Disabled — apply to parent, not icon directly
<button disabled className="disabled:opacity-50">
  <FileText className="h-5 w-5" />
</button>
```

### Icon containers

Predefined CSS classes for consistent icon backgrounds:

```tsx
<div className="icon-container icon-container-primary">
  <Wrench className="h-5 w-5" />
</div>
// Variants: icon-container-success | -warning | -destructive
```

---

## 3. UI State Components

### 3.1 SkeletonBlock

Single rectangular placeholder — use while a single piece of content is loading.

```tsx
import { SkeletonBlock } from '@/components/ui/skeleton';

// Default: full-width, 1rem tall
<SkeletonBlock />

// Custom dimensions
<SkeletonBlock height="h-6" width="w-48" />
<SkeletonBlock height="h-32" width="w-full" /> // image placeholder
```

### 3.2 SkeletonList

Vertical list of avatar + text rows — use while a list/feed is loading.

```tsx
import { SkeletonList } from '@/components/ui/skeleton';

<SkeletonList rows={5} />
```

### 3.3 EmptyState

Used when a list or section has **no content yet**. Always pass a CTA when the user can resolve the empty state.

```tsx
import { EmptyState } from '@/components/ui/empty-state';
import { FileText } from 'lucide-react';

<EmptyState
  icon={FileText}
  title={t('offers.empty.title')}
  description={t('offers.empty.desc')}
  ctaLabel={t('offers.empty.cta')}
  onCta={() => navigate('/app/offers/new')}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | `LucideIcon` | ✅ | Icon to display |
| `title` | `string` | ✅ | Main headline |
| `description` | `string` | — | Supporting text |
| `ctaLabel` | `string` | — | Button label |
| `onCta` | `() => void` | — | Button handler |
| `className` | `string` | — | Wrapper class override |

> **Rule:** If the user has an action available (create, search, filter), always provide `ctaLabel` + `onCta`.

### 3.4 ErrorState

Inline recoverable error within a panel or section. Do **not** use `toast.error()` for these — show `ErrorState` so the user can retry.

```tsx
import { ErrorState } from '@/components/ui/error-state';

<ErrorState
  title={t('errors.loadFailed')}
  description={t('errors.checkConnection')}
  onRetry={() => refetch()}
  retryLabel={t('common.tryAgain')}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | ✅ | Error headline |
| `description` | `string` | — | Additional context |
| `onRetry` | `() => void` | — | Retry handler (omit to hide button) |
| `retryLabel` | `string` | — | Retry button label (default: "Try again") |
| `className` | `string` | — | Wrapper class override |

### 3.5 Toast (success / info only)

Toasts via [Sonner](https://sonner.emilkowal.ski/). Use **only** for transient success or info feedback.

```tsx
import { toast } from 'sonner';

// ✅ Correct use cases
toast.success(t('offers.saved'));
toast.info(t('sync.checking'));

// ❌ Wrong — use <ErrorState> instead
toast.error('Could not load data');
```

The `<Toaster />` component is already mounted in `App.tsx` — no extra setup needed.

---

## 4. Accessibility & Touch Targets

### Focus rings

All interactive components use Tailwind's `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` — keyboard navigation is covered by default in `<Button>` and `<Input>`.

For custom interactive elements, add the `.focus-ring` utility:

```tsx
<div tabIndex={0} role="button" className="focus-ring">…</div>
```

Or use Tailwind directly:

```tsx
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

### Touch targets (WCAG 2.5.5)

Interactive elements should be at minimum **44×44 px**. Use the `.touch-target` CSS utility or Tailwind classes:

```tsx
// CSS utility class
<button className="touch-target">…</button>

// Tailwind equivalent
<button className="min-h-[44px] min-w-[44px]">…</button>
```

`<Button size="default">` (`h-10` = 40px) is close — add `className="min-h-[44px]"` when in mobile-primary contexts.

### Micro-interactions

Transitions target **120–180 ms** — fast enough to feel snappy, slow enough to be perceivable:

```css
/* Already in index.css */
transition: box-shadow 0.15s ease;   /* hover-lift */
transition: transform  0.15s ease;   /* hover-scale */
transition: all        0.2s ease;    /* accordion */
```

Do **not** introduce heavier animations (>300 ms) in UI state components.

---

## 5. i18n Integration

All text displayed to the user must be translated. Pass translated strings into component props — don't hardcode Polish/English/Ukrainian strings in components.

```tsx
// ✅ Correct
<EmptyState
  title={t('clients.empty.title')}
  description={t('clients.empty.description')}
  ctaLabel={t('clients.empty.cta')}
  onCta={handleCreate}
/>

// ❌ Wrong — hardcoded string
<EmptyState title="Brak klientów" … />
```

Translation files are in `src/i18n/`. Add keys to all locales when adding a new UI string.

---

## 6. Adding a New Screen — Checklist

When adding a new page/panel that lists data:

- [ ] Loading state: render `<SkeletonList />` or `<SkeletonBlock />` while data fetches
- [ ] Empty state: render `<EmptyState>` with a CTA when the list is empty
- [ ] Error state: render `<ErrorState onRetry={refetch}>` on query error
- [ ] Success feedback: `toast.success(...)` after create/update/delete
- [ ] All text strings use `t(...)` — zero hardcoded strings
- [ ] Buttons/inputs have visible focus rings (built-in via component defaults)
- [ ] Touch targets ≥ 44 px in mobile views
