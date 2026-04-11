/**
 * OfflineBanner — PR-19
 *
 * Maly, nieblokujacy baner pokazywany na gorze ekranu gdy brak sieci.
 * Nie blokuje aplikacji — uzytkownik moze przegladac dane z cache.
 */

import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm font-medium text-warning-foreground shadow-md"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{t('offline.banner')}</span>
    </div>
  );
}
