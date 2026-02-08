import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardInteractive,
} from '@/components/ui/card';

/**
 * Regression test for P0 Analytics crash: "CardHeader is not defined"
 *
 * Root cause: ESLint no-unused-vars auto-rename prefixed JSX component imports
 * with underscore (_CardHeader), but JSX still referenced the un-prefixed name.
 * See commit b2e3ea4 (broke) and a4fe476 (fixed).
 *
 * This test ensures every named export from card.tsx is:
 *   1. A defined value (not undefined/null)
 *   2. Renderable as a React component without throwing
 */
describe('card.tsx exports — regression guard', () => {
  it('all named exports are defined React components', () => {
    expect(Card).toBeDefined();
    expect(CardHeader).toBeDefined();
    expect(CardTitle).toBeDefined();
    expect(CardDescription).toBeDefined();
    expect(CardContent).toBeDefined();
    expect(CardFooter).toBeDefined();
    expect(CardInteractive).toBeDefined();
  });

  it('CardHeader renders without crashing (P0 regression)', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    expect(container.querySelector('[class*="flex flex-col space-y-1.5"]')).toBeTruthy();
  });

  it('CardHeader has correct displayName', () => {
    expect(CardHeader.displayName).toBe('CardHeader');
  });
});
