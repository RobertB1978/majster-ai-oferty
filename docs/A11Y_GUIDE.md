# Accessibility Testing Guide

**Security Pack Δ1 - PROMPT 4/10**

This guide explains how to run and maintain automated accessibility tests.

---

## Quick Start

```bash
# Run a11y tests
npm run e2e -- a11y.spec.ts

# Run all E2E tests (including a11y)
npm run e2e
```

---

## What We Test

- **WCAG 2.1 Level AA** compliance
- **Critical violations** that block usage
- **Keyboard navigation**
- **Screen reader compatibility**

---

## Automated Checks

Our tests use **axe-core** to catch:

✅ Missing alt text on images
✅ Insufficient color contrast
✅ Missing form labels
✅ Invalid ARIA attributes
✅ Keyboard navigation issues
✅ Focus management problems

---

## Adding New A11y Tests

```typescript
import AxeBuilder from '@axe-core/playwright';

test('my page should be accessible', async ({ page }) => {
  await page.goto('/my-page');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

---

## Fixing Violations

When tests fail:

1. **Check the error message** - shows which rule failed
2. **Find the element** - error shows CSS selector
3. **Read the documentation** - each rule has a helpUrl
4. **Fix and re-test**

Common fixes:
- Add `aria-label` to icon buttons
- Increase color contrast
- Add `<label>` to form inputs
- Fix heading hierarchy

---

## Manual Testing

Automated tests catch ~30-40% of a11y issues. Also test manually:

- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader (NVDA on Windows, VoiceOver on Mac)
- [ ] Zoom to 200% (should still be usable)
- [ ] High contrast mode

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

**Last updated:** 2025-12-16
