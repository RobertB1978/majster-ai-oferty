/**
 * useUnsavedChanges — regression test
 *
 * Verifies that the hook does NOT crash in a BrowserRouter context
 * (i.e. without DataRouterContext provided by createBrowserRouter).
 *
 * Root cause of MAJ-UNK-001: useBlocker requires DataRouterContext.
 * BrowserRouter doesn't provide it → invariant(false) → Error("") in production.
 * Fix: removed useBlocker, returns static IDLE_BLOCKER instead.
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { createElement } from 'react';
import { useUnsavedChanges } from './useUnsavedChanges';

function wrapper({ children }: { children: React.ReactNode }) {
  return createElement(BrowserRouter, null, children);
}

describe('useUnsavedChanges', () => {
  it('does not crash inside BrowserRouter (no DataRouterContext)', () => {
    // Before the fix this threw: invariant(false) → Error("") in prod builds
    expect(() =>
      renderHook(() => useUnsavedChanges(false), { wrapper }),
    ).not.toThrow();
  });

  it('returns idle blocker state when not dirty', () => {
    const { result } = renderHook(() => useUnsavedChanges(false), { wrapper });
    expect(result.current.blocker.state).toBe('unblocked');
    expect(result.current.isDirty).toBe(false);
  });

  it('returns idle blocker state when dirty (navigation blocking disabled)', () => {
    const { result } = renderHook(() => useUnsavedChanges(true), { wrapper });
    // useBlocker is removed — blocker is always unblocked to prevent the crash
    expect(result.current.blocker.state).toBe('unblocked');
    expect(result.current.isDirty).toBe(true);
  });
});
