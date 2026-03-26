/**
 * FieldSafetyBanner — subtle status bar for active field-safety modes.
 *
 * Shows ONLY when one of the field-safety modes is active:
 * - Battery ≤ 20%: amber warning with battery icon
 * - High-Glare (prefers-contrast: more): sun icon
 *
 * Dismissed by the user and remembered in sessionStorage for the current session.
 * Auto-reappears next session so the user is always informed.
 */
import { useState } from 'react';
import { Battery, Sun, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHighGlare, useBatterySaver } from '@/hooks/useFieldSafety';

export function FieldSafetyBanner() {
  const { t } = useTranslation();
  const highGlare = useHighGlare();
  const batterySaver = useBatterySaver();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('field_safety_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  if ((!highGlare && !batterySaver) || dismissed) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('field_safety_banner_dismissed', 'true');
    } catch {
      // private mode — ignore
    }
    setDismissed(true);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400"
    >
      {batterySaver && <Battery className="h-4 w-4 shrink-0" aria-hidden="true" />}
      {highGlare && !batterySaver && <Sun className="h-4 w-4 shrink-0" aria-hidden="true" />}
      <span className="flex-1 text-xs">
        {batterySaver
          ? t('fieldSafety.batterySaverActive', 'Tryb oszczędzania baterii — animacje wyłączone')
          : t('fieldSafety.highGlareActive', 'Tryb wysokiego kontrastu — lepsza czytelność w słońcu')}
      </span>
      <button
        onClick={handleDismiss}
        className="ml-auto shrink-0 p-1 rounded hover:bg-amber-500/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label={t('common.dismiss', 'Zamknij')}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
