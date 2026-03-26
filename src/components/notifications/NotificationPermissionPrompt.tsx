/**
 * NotificationPermissionPrompt — PR-18
 *
 * Shows notification permission state:
 * - 'granted': invisible (nothing rendered)
 * - 'denied': EmptyState with "Otwórz ustawienia systemu"
 * - 'default'/'unsupported': soft prompt to enable
 *
 * If notifications are denied or unsupported, the app still works
 * using the in-app reminders list.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotificationPermission() {
  const [permission, setPermission] = useState<PermissionState>('unsupported');

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PermissionState);
  }, []);

  const request = async () => {
    if (!('Notification' in window)) return 'unsupported' as PermissionState;
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      return result as PermissionState;
    } catch (e) {
      logger.error('Notification.requestPermission failed', e);
      setPermission('denied');
      return 'denied' as PermissionState;
    }
  };

  return { permission, request };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface NotificationPermissionPromptProps {
  /** If true, only show the denied/blocked state. Don't show the 'enable' prompt. */
  onlyShowBlocked?: boolean;
}

export function NotificationPermissionPrompt({
  onlyShowBlocked = false,
}: NotificationPermissionPromptProps) {
  const { t } = useTranslation();
  const { permission, request } = useNotificationPermission();

  // Denied → show EmptyState with link to system settings
  if (permission === 'denied') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-4">
        <BellOff className="h-8 w-8 text-destructive/60" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-destructive">
            {t('reminders.notificationDenied')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('reminders.notificationDeniedDesc')}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-destructive/30 text-destructive hover:text-destructive"
          onClick={() => {
            // Open system settings (best-effort — works in some browsers)
            window.open('about:preferences#privacy', '_blank');
          }}
        >
          <Settings className="h-3.5 w-3.5" />
          {t('reminders.openSystemSettings')}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          {t('reminders.inAppRemindersFallback')}
        </p>
      </div>
    );
  }

  // Unsupported → just note that in-app reminders are active
  if (permission === 'unsupported') {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Bell className="h-3.5 w-3.5 shrink-0" />
        <span>{t('reminders.inAppRemindersFallback')}</span>
      </div>
    );
  }

  // Default → show soft prompt (skip if onlyShowBlocked)
  if (permission === 'default' && !onlyShowBlocked) {
    return (
      <div className="flex items-center gap-3 py-2 px-3 rounded-lg border bg-muted/30">
        <Bell className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs text-muted-foreground flex-1">
          {t('reminders.enableNotificationsPrompt')}
        </span>
        <Button size="sm" variant="outline" className="text-xs min-h-[44px] px-3" onClick={request}>
          {t('reminders.enableNotifications')}
        </Button>
      </div>
    );
  }

  // Granted → nothing
  return null;
}
