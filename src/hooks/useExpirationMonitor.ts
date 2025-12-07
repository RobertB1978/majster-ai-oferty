import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateNotification } from '@/hooks/useNotifications';
import { differenceInDays, differenceInHours, parseISO, isBefore } from 'date-fns';

interface ExpiringOffer {
  id: string;
  project_id: string;
  client_name: string | null;
  client_email: string | null;
  expires_at: string;
  created_at: string;
}

interface ExpiringSubscription {
  id: string;
  plan_id: string;
  current_period_end: string | null;
  status: string;
}

/**
 * Monitors and creates notifications for expiring offers and subscriptions
 */
export function useExpirationMonitor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const createNotification = useCreateNotification();

  // Fetch offers expiring within 7 days
  const { data: expiringOffers } = useQuery({
    queryKey: ['expiring-offers'],
    queryFn: async () => {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { data, error } = await supabase
        .from('offer_approvals')
        .select('id, project_id, client_name, client_email, expires_at, created_at')
        .eq('user_id', user!.id)
        .eq('status', 'pending')
        .lte('expires_at', sevenDaysFromNow.toISOString())
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true });

      if (error) throw error;
      return data as ExpiringOffer[];
    },
    enabled: !!user,
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
  });

  // Fetch subscription status
  const { data: subscription } = useQuery({
    queryKey: ['subscription-expiration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('id, plan_id, current_period_end, status')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as ExpiringSubscription | null;
    },
    enabled: !!user,
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
  });

  // Check for notification already sent today
  const wasNotificationSentToday = useCallback(async (title: string): Promise<boolean> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user!.id)
      .eq('title', title)
      .gte('created_at', today.toISOString())
      .limit(1);

    return (data?.length || 0) > 0;
  }, [user]);

  // Create expiration notifications
  const checkAndNotify = useCallback(async () => {
    if (!user) return;

    // Check expiring offers
    if (expiringOffers && expiringOffers.length > 0) {
      for (const offer of expiringOffers) {
        const expiresAt = parseISO(offer.expires_at);
        const daysLeft = differenceInDays(expiresAt, new Date());
        const hoursLeft = differenceInHours(expiresAt, new Date());

        let title = '';
        let message = '';
        let type: 'info' | 'warning' | 'error' = 'info';

        if (hoursLeft <= 24) {
          title = 'Oferta wygasa dziś!';
          message = `Oferta dla ${offer.client_name || offer.client_email || 'klienta'} wygasa za ${hoursLeft} godzin. Rozważ przedłużenie lub kontakt z klientem.`;
          type = 'error';
        } else if (daysLeft <= 3) {
          title = 'Oferta wkrótce wygasa';
          message = `Oferta dla ${offer.client_name || offer.client_email || 'klienta'} wygasa za ${daysLeft} dni.`;
          type = 'warning';
        } else if (daysLeft <= 7) {
          title = 'Przypomnienie o wygasającej ofercie';
          message = `Oferta dla ${offer.client_name || offer.client_email || 'klienta'} wygasa za ${daysLeft} dni.`;
          type = 'info';
        }

        if (title && !(await wasNotificationSentToday(title))) {
          createNotification.mutate({
            title,
            message,
            type,
            action_url: `/projects/${offer.project_id}`,
          });
        }
      }
    }

    // Check subscription expiration
    if (subscription && subscription.current_period_end && subscription.plan_id !== 'free') {
      const expiresAt = parseISO(subscription.current_period_end);
      const daysLeft = differenceInDays(expiresAt, new Date());

      if (isBefore(expiresAt, new Date())) {
        // Already expired
        const title = 'Plan wygasł';
        if (!(await wasNotificationSentToday(title))) {
          createNotification.mutate({
            title,
            message: `Twój plan ${subscription.plan_id} wygasł. Odnów subskrypcję, aby zachować dostęp do wszystkich funkcji.`,
            type: 'error',
            action_url: '/billing',
          });
        }
      } else if (daysLeft <= 3) {
        const title = 'Plan wkrótce wygasa!';
        if (!(await wasNotificationSentToday(title))) {
          createNotification.mutate({
            title,
            message: `Twój plan ${subscription.plan_id} wygasa za ${daysLeft} dni. Odnów teraz, aby uniknąć przerwy w działaniu.`,
            type: 'warning',
            action_url: '/billing',
          });
        }
      } else if (daysLeft <= 7) {
        const title = 'Przypomnienie o odnowieniu planu';
        if (!(await wasNotificationSentToday(title))) {
          createNotification.mutate({
            title,
            message: `Twój plan ${subscription.plan_id} wygasa za ${daysLeft} dni.`,
            type: 'info',
            action_url: '/billing',
          });
        }
      }
    }
  }, [user, expiringOffers, subscription, createNotification, wasNotificationSentToday]);

  // Run check on mount and when data changes
  useEffect(() => {
    if (user && (expiringOffers || subscription)) {
      checkAndNotify();
    }
  }, [user, expiringOffers, subscription, checkAndNotify]);

  return {
    expiringOffersCount: expiringOffers?.length || 0,
    subscriptionExpiresIn: subscription?.current_period_end 
      ? differenceInDays(parseISO(subscription.current_period_end), new Date())
      : null,
    isSubscriptionExpiring: subscription?.current_period_end 
      ? differenceInDays(parseISO(subscription.current_period_end), new Date()) <= 7
      : false,
  };
}
