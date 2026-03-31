import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import type { Notification } from './useNotifications';

/**
 * Subscribes to Supabase Realtime INSERT events on the `notifications` table
 * filtered to the current user. On new notification: shows a toast and
 * invalidates the TanStack Query `['notifications']` cache so the
 * NotificationCenter bell updates immediately.
 *
 * Must be called from a component inside <BrowserRouter> and <QueryClientProvider>.
 */
export function useRealtimeNotifications(): void {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as Notification;

          const toastOptions = {
            description: notification.message,
            ...(notification.action_url
              ? {
                  action: {
                    label: 'Otwórz',
                    onClick: () => navigate(notification.action_url!),
                  },
                }
              : {}),
          };

          switch (notification.type) {
            case 'success':
              toast.success(notification.title, toastOptions);
              break;
            case 'error':
              toast.error(notification.title, toastOptions);
              break;
            case 'warning':
              toast.warning(notification.title, toastOptions);
              break;
            default:
              toast.info(notification.title, toastOptions);
          }

          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, navigate]);
}
