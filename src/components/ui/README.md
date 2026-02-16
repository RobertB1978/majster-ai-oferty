# UI Component Library

**Majster.AI Design System** - Professional SaaS UI components built with shadcn/ui and Radix UI primitives.

## Overview

This directory contains **55 production-ready UI components** following industry best practices for accessibility, performance, and maintainability.

### Technology Stack

- **shadcn/ui** - Component primitives and patterns
- **Radix UI** - Accessible, unstyled component primitives
- **Tailwind CSS** - Utility-first styling
- **class-variance-authority (cva)** - Component variant management
- **Lucide React** - Icon library

---

## Core Components

### Layout & Structure

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `Card` | Content containers | Header, content, footer sections |
| `Separator` | Visual dividers | Horizontal/vertical orientation |
| `Aspect Ratio` | Responsive media | Maintains aspect ratios |
| `Tabs` | Content organization | Keyboard navigation, ARIA |

### Forms & Input

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `Button` | Actions & CTAs | Multiple variants, loading states |
| `Input` | Text input | Type-safe, validation support |
| `Textarea` | Multi-line text | Auto-resize option |
| `Select` | Dropdown selection | Searchable, multi-select |
| `Checkbox` | Boolean input | Indeterminate state support |
| `Radio Group` | Single choice | Keyboard navigation |
| `Switch` | Toggle control | Accessible on/off state |
| `Slider` | Range input | Min/max, step control |
| `Form` | Form management | React Hook Form integration |

### Feedback & Notifications

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `Alert` | Contextual messages | Success, warning, error, info |
| `Toast` | Temporary notifications | Auto-dismiss, action buttons |
| `Progress` | Loading indication | Determinate/indeterminate |
| `Skeleton` | Loading placeholder | Content shape preview |
| `Badge` | Status indicators | Multiple variants |

### Overlays & Dialogs

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `Dialog` | Modal windows | Focus trap, ESC to close |
| `Alert Dialog` | Confirmations | Destructive actions |
| `Sheet` | Slide-in panels | Left/right/top/bottom |
| `Drawer` | Bottom sheet | Mobile-optimized |
| `Popover` | Contextual content | Positioning engine |
| `Tooltip` | Hints & help | Delay, positioning |
| `Dropdown Menu` | Action menus | Keyboard navigation |
| `Context Menu` | Right-click menus | Platform-aware |

### Navigation

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `Navigation Menu` | Top-level nav | Mega menu support |
| `Breadcrumb` | Page hierarchy | Truncation, separators |
| `Pagination` | Page navigation | Ellipsis, custom ranges |

### Data Display

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `Table` | Tabular data | Sorting, filtering, pagination |
| `Chart` | Data visualization | Recharts integration |
| `Avatar` | User representation | Fallback, status indicator |
| `Calendar` | Date selection | Range selection, localization |

---

## Design Tokens

Components use CSS variables for consistent theming:

```css
/* Primary Colors */
--primary: 30 90% 32%;        /* Deep Amber (light mode) */
--primary: 38 92% 55%;        /* Safety Amber (dark mode) */

/* Semantic Colors */
--destructive: Red for errors/warnings
--success: Green for confirmations
--warning: Amber for alerts
--info: Blue for information

/* Z-Index Layers */
--z-nav: 40;      /* Navigation */
--z-overlay: 50;  /* Overlays (modals, toasts) */
--z-modal: 60;    /* Top-level modals */
```

---

## Usage Patterns

### Basic Example

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Get Started</Button>
      </CardContent>
    </Card>
  );
}
```

### With Variants

```tsx
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>

<Badge variant="default">New</Badge>
<Badge variant="secondary">Updated</Badge>
<Badge variant="outline">Draft</Badge>
<Badge variant="destructive">Error</Badge>
```

### Form Integration

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  email: z.string().email(),
});

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
  });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} type="email" />
            </FormControl>
          </FormItem>
        )}
      />
      <Button type="submit">Login</Button>
    </Form>
  );
}
```

---

## Accessibility

All components follow **WCAG 2.1 Level AA** guidelines:

✅ **Keyboard Navigation** - Full keyboard support
✅ **Screen Reader** - Proper ARIA labels and roles
✅ **Focus Management** - Visible focus indicators
✅ **Color Contrast** - Meets 4.5:1 minimum ratio
✅ **Touch Targets** - Minimum 44x44px hit areas

---

## Component Audit Status

### ✅ Production-Ready
- All 55 components tested and in production use
- TypeScript types enforced
- Responsive design patterns
- Dark mode support

### 🔄 Continuous Improvements
- Enhanced JSDoc documentation (in progress)
- Additional variant patterns
- Performance optimizations
- Extended test coverage

---

## Best Practices

### DO ✅

```tsx
// Use semantic variants
<Button variant="destructive">Delete Account</Button>

// Provide ARIA labels for icon-only buttons
<Button aria-label="Close menu">
  <X className="h-4 w-4" />
</Button>

// Use proper form patterns
<Form {...form}>
  <FormField ... />
</Form>

// Compose components properly
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### DON'T ❌

```tsx
// Don't hardcode colors
<Button className="bg-red-500">Delete</Button> // ❌
<Button variant="destructive">Delete</Button>  // ✅

// Don't skip accessibility
<button onClick={handleClick}>
  <X />
</button> // ❌

<Button aria-label="Close" onClick={handleClick}>
  <X />
</Button> // ✅

// Don't break component composition
<Card>
  <div>Content</div> // ❌
</Card>

<Card>
  <CardContent>Content</CardContent> // ✅
</Card>
```

---

## Adding New Components

When adding shadcn/ui components:

1. **Install via CLI:**
   ```bash
   npx shadcn@latest add [component-name]
   ```

2. **Review generated code** - Check for:
   - TypeScript types
   - Accessibility attributes
   - Tailwind classes alignment

3. **Test thoroughly:**
   - Keyboard navigation
   - Screen readers
   - Light/dark modes
   - Mobile responsiveness

4. **Document usage** - Add to this README

---

## Performance Notes

### Code Splitting

Chart components are lazy-loaded:
```tsx
// chart-lazy.tsx automatically handles lazy loading
import { LineChart, BarChart } from '@/components/ui/chart-lazy';
```

### Bundle Optimization

- Tree-shakeable exports
- No runtime CSS-in-JS (uses Tailwind)
- Minimal dependencies

---

## Contributing

When modifying components:

1. **Maintain backward compatibility**
2. **Update TypeScript types**
3. **Test accessibility**
4. **Update this README** if API changes
5. **Follow existing patterns**

---

## Support

For component issues or questions:
- Check [shadcn/ui docs](https://ui.shadcn.com)
- Review [Radix UI docs](https://radix-ui.com)
- See project CLAUDE.md for coding standards

---

**Last Updated:** 2026-02-16
**Components:** 55 production-ready
**Framework:** React 18 + TypeScript 5.8
**Status:** ✅ Production
