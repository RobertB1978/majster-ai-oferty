import { useEffect, useState } from 'react';

/**
 * 2-second splash screen shown once per session on first load.
 * Dismissed automatically or on click. Stored in sessionStorage to avoid
 * showing on every navigation.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    // Show only once per session
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('splash_dismissed');
  });
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const fadeTimer = setTimeout(() => setFadeOut(true), 1700);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('splash_dismissed', '1');
    }, 2100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [visible]);

  const dismiss = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('splash_dismissed', '1');
    }, 400);
  };

  if (!visible) return null;

  return (
    <div
      role="presentation"
      aria-hidden="true"
      onClick={dismiss}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-400 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ cursor: 'pointer' }}
    >
      {/* Animated logo */}
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-2xl shadow-primary/30">
          {/* Wrench SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 text-primary-foreground"
            style={{
              animation: 'wrench-swing 0.9s ease-in-out 0.2s 2 alternate',
            }}
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          {/* Pulsing ring */}
          <span className="absolute inset-0 rounded-3xl border-2 border-primary animate-ping opacity-30" />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Majster.AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ładowanie…</p>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1 rounded-full bg-primary/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary"
            style={{
              animation: 'splash-bar 1.8s ease-out forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes wrench-swing {
          from { transform: rotate(-15deg); }
          to   { transform: rotate(15deg); }
        }
        @keyframes splash-bar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
