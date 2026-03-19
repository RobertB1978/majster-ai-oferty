import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function PushNotificationSettings() {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    offers: true,
    deadlines: true,
    approvals: true,
    marketing: false,
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      // Check if already subscribed
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(async (registration) => {
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        });
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error(t('pushNotifications.toast.notSupported'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Register service worker and subscribe
        if ('serviceWorker' in navigator) {
          const _registration = await navigator.serviceWorker.ready;

          // In production, you would subscribe to push here
          // const subscription = await registration.pushManager.subscribe({
          //   userVisibleOnly: true,
          //   applicationServerKey: VAPID_PUBLIC_KEY
          // });

          setIsSubscribed(true);
          toast.success(t('pushNotifications.toast.enabled'));
        }
      } else if (result === 'denied') {
        toast.error(t('pushNotifications.toast.blocked'));
      }
    } catch (error) {
      logger.error('Error requesting notification permission:', error);
      toast.error(t('pushNotifications.toast.enableError'));
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }
      setIsSubscribed(false);
      toast.success(t('pushNotifications.toast.disabled'));
    } catch (_error) {
      toast.error(t('pushNotifications.toast.disableError'));
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = () => {
    if (permission === 'granted') {
      new Notification('Majster.AI - Test', {
        body: t('pushNotifications.testBody'),
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('pushNotifications.title')}
        </CardTitle>
        <CardDescription>
          {t('pushNotifications.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <div className="p-2 rounded-full bg-green-500/20">
                <Check className="h-5 w-5 text-green-500" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-muted-foreground/20">
                <BellOff className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-medium">
                {isSubscribed ? t('pushNotifications.enabled') : t('pushNotifications.disabled')}
              </p>
              <p className="text-sm text-muted-foreground">
                {permission === 'denied'
                  ? t('pushNotifications.blockedInBrowser')
                  : isSubscribed
                    ? t('pushNotifications.receiving')
                    : t('pushNotifications.enablePrompt')}
              </p>
            </div>
          </div>
          {permission !== 'denied' && (
            <Button
              variant={isSubscribed ? 'outline' : 'default'}
              onClick={isSubscribed ? unsubscribe : requestPermission}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSubscribed ? (
                t('pushNotifications.disable')
              ) : (
                t('pushNotifications.enable')
              )}
            </Button>
          )}
        </div>

        {/* Settings */}
        {isSubscribed && (
          <div className="space-y-4">
            <h4 className="font-medium">{t('pushNotifications.notificationTypes')}</h4>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t('pushNotifications.newOffers')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('pushNotifications.newOffersDesc')}
                </p>
              </div>
              <Switch
                checked={settings.offers}
                onCheckedChange={(checked) => setSettings({ ...settings, offers: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t('pushNotifications.projectDeadlines')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('pushNotifications.projectDeadlinesDesc')}
                </p>
              </div>
              <Switch
                checked={settings.deadlines}
                onCheckedChange={(checked) => setSettings({ ...settings, deadlines: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t('pushNotifications.offerApprovals')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('pushNotifications.offerApprovalsDesc')}
                </p>
              </div>
              <Switch
                checked={settings.approvals}
                onCheckedChange={(checked) => setSettings({ ...settings, approvals: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t('pushNotifications.marketing')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('pushNotifications.marketingDesc')}
                </p>
              </div>
              <Switch
                checked={settings.marketing}
                onCheckedChange={(checked) => setSettings({ ...settings, marketing: checked })}
              />
            </div>

            <Button variant="outline" size="sm" onClick={testNotification}>
              {t('pushNotifications.sendTest')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
