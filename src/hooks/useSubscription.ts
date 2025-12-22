import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: 'free' | 'pro' | 'starter' | 'business' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserSubscription | null;
    },
    enabled: !!user,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (planId: 'free' | 'pro' | 'starter' | 'business' | 'enterprise') => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user!.id,
          plan_id: planId,
          status: 'active',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
    },
  });
}

export function usePlanFeatures() {
  const { data: subscription } = useUserSubscription();
  const currentPlan = subscription?.plan_id || 'free';

  const features: Record<string, unknown> = {
    free: {
      maxProjects: 3,
      maxClients: 5,
      maxExportRecords: 500,
      hasAds: true,
      hasAI: false,
      hasVoice: false,
      hasDocuments: false,
      hasExcelExport: false,
      hasCalendarSync: false,
      hasPrioritySupport: false,
      hasApi: false,
      hasCustomTemplates: false,
    },
    pro: {
      maxProjects: 15,
      maxClients: 30,
      maxExportRecords: 500,
      hasAds: false,
      hasAI: false,
      hasVoice: false,
      hasDocuments: false,
      hasExcelExport: true,
      hasCalendarSync: false,
      hasPrioritySupport: false,
      hasApi: false,
      hasCustomTemplates: false,
    },
    starter: {
      maxProjects: 15,
      maxClients: 30,
      maxExportRecords: 500,
      hasAds: false,
      hasAI: false,
      hasVoice: false,
      hasDocuments: false,
      hasExcelExport: true,
      hasCalendarSync: false,
      hasPrioritySupport: false,
      hasApi: false,
      hasCustomTemplates: false,
    },
    business: {
      maxProjects: Infinity,
      maxClients: Infinity,
      maxExportRecords: 2000,
      hasAds: false,
      hasAI: true,
      hasVoice: true,
      hasDocuments: true,
      hasExcelExport: true,
      hasCalendarSync: true,
      hasPrioritySupport: true,
      hasApi: false,
      hasCustomTemplates: false,
    },
    enterprise: {
      maxProjects: Infinity,
      maxClients: Infinity,
      maxExportRecords: Infinity,
      hasAds: false,
      hasAI: true,
      hasVoice: true,
      hasDocuments: true,
      hasExcelExport: true,
      hasCalendarSync: true,
      hasPrioritySupport: true,
      hasApi: true,
      hasCustomTemplates: true,
    },
  };

  return {
    currentPlan,
    features: features[currentPlan],
    maxExportRecords: features[currentPlan].maxExportRecords,
    isPremium: currentPlan !== 'free',
    canUseAI: features[currentPlan].hasAI,
    canUseVoice: features[currentPlan].hasVoice,
    showAds: features[currentPlan].hasAds,
  };
}
