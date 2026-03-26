/**
 * Keyboard shortcuts for Dense Office Mode — roadmap §9 / ETAP 6 (P2)
 *
 * Active ONLY when Dense Mode is enabled (effectiveDense = true).
 * NEVER fires when focus is in an input, textarea, select, or contenteditable.
 *
 * Shortcut map (from roadmap §9):
 *   N          → new offer  (/app/quick-est)
 *   P          → projects   (/app/projects)
 *   K          → clients    (/app/customers)
 *   /          → focus global search (if element exists)
 *   Ctrl+S     → trigger save (dispatches custom event "app:save")
 *   G then D   → dashboard  (/app)
 *   G then O   → offers     (/app/offers)
 *   G then P   → projects   (/app/projects)
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (el as HTMLElement).isContentEditable
  );
}

export function useKeyboardShortcuts(effectiveDense: boolean) {
  const navigate = useNavigate();
  const gPressedAt = useRef<number | null>(null);
  const G_SEQUENCE_TIMEOUT = 1500; // ms to complete G+X chord

  useEffect(() => {
    if (!effectiveDense) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Never fire when user is typing in an input
      if (isInputFocused()) return;

      const key = e.key;

      // Ctrl+S — trigger save
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('app:save'));
        return;
      }

      // Skip if any modifier held (except for Ctrl+S above)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // G-chord detection
      if (key === 'g' || key === 'G') {
        gPressedAt.current = Date.now();
        return;
      }

      // Second key of G+X chord
      if (gPressedAt.current !== null) {
        const elapsed = Date.now() - gPressedAt.current;
        gPressedAt.current = null;

        if (elapsed < G_SEQUENCE_TIMEOUT) {
          if (key === 'd' || key === 'D') { navigate('/app'); return; }
          if (key === 'o' || key === 'O') { navigate('/app/offers'); return; }
          if (key === 'p' || key === 'P') { navigate('/app/projects'); return; }
        }
        // Fall through — handle as single key
      }

      // Single-key shortcuts
      if (key === 'n' || key === 'N') { navigate('/app/quick-est'); return; }
      if (key === 'p' || key === 'P') { navigate('/app/projects'); return; }
      if (key === 'k' || key === 'K') { navigate('/app/customers'); return; }

      if (key === '/') {
        e.preventDefault();
        const searchEl = document.querySelector<HTMLElement>('[data-global-search]');
        if (searchEl) searchEl.focus();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveDense, navigate]);
}
