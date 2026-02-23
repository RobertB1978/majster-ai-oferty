/**
 * Cloudflare Turnstile CAPTCHA widget
 *
 * Feature-flagged via VITE_TURNSTILE_ENABLED + VITE_TURNSTILE_SITE_KEY.
 * When disabled the container is still mounted (for e2e selectors) but
 * immediately calls onVerify('bypass') so forms are not blocked.
 */
import { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TurnstileRenderParams {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        params: TurnstileRenderParams,
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    _turnstileOnLoad?: () => void;
  }
}

// ---------------------------------------------------------------------------
// Constants (exported for use in parent components)
// ---------------------------------------------------------------------------

export const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';

export const isCaptchaEnabled =
  import.meta.env.VITE_TURNSTILE_ENABLED === 'true' &&
  TURNSTILE_SITE_KEY.length > 0;

const SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=_turnstileOnLoad&render=explicit';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

export function TurnstileWidget({
  onVerify,
  onError,
  theme = 'auto',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // When feature is disabled, auto-verify immediately so forms aren't blocked
    if (!isCaptchaEnabled) {
      onVerify('bypass');
      return;
    }

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: onVerify,
        'error-callback': onError,
        'expired-callback': () => {
          widgetIdRef.current = null;
        },
        theme,
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      // Chain onto any existing onload callback
      const prev = window._turnstileOnLoad;
      window._turnstileOnLoad = () => {
        prev?.();
        renderWidget();
      };

      if (!document.querySelector('script[data-turnstile]')) {
        const script = document.createElement('script');
        script.src = SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.dataset.turnstile = '1';
        document.head.appendChild(script);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // onVerify / onError are stable refs from parent; theme is primitive
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return (
    <div
      ref={containerRef}
      data-testid="turnstile-widget"
      aria-label="CAPTCHA verification"
      // Empty & zero-height when disabled so the layout is not affected
      className={isCaptchaEnabled ? 'my-2' : 'hidden'}
    />
  );
}
