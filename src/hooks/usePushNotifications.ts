import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface PushNotificationState {
  isSupported: boolean;
  isRegistered: boolean;
  token: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isRegistered: false,
    token: null,
  });

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    setState(prev => ({ ...prev, isSupported: isNative }));

    if (!isNative) return;

    // Request permission and register
    const registerPush = async () => {
      try {
        // Check current permission status
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('Push notification permission not granted');
          return;
        }

        // Register with Apple / Google
        await PushNotifications.register();
      } catch (error) {
        console.error('Error registering push notifications:', error);
      }
    };

    // Listeners
    PushNotifications.addListener('registration', (token: Token) => {
      // Use safe logger with automatic PII/token masking (see @/lib/logger.ts)
      logger.info('Push registration success, token:', token.value);
      setState(prev => ({ ...prev, isRegistered: true, token: token.value }));
    });

    PushNotifications.addListener('registrationError', (error: unknown) => {
      console.error('Push registration error:', error);
      toast.error('Błąd rejestracji powiadomień push');
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      logger.info('Push notification received:', notification);
      toast(notification.title || 'Powiadomienie', {
        description: notification.body,
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      logger.info('Push notification action performed:', notification);
    });

    registerPush();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);

  const requestPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast.info('Push notifications są dostępne tylko w natywnej aplikacji mobilnej');
      return false;
    }

    try {
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        await PushNotifications.register();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  };

  return {
    ...state,
    requestPermission,
  };
}
