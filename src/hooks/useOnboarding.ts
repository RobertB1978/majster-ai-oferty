import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

export interface OnboardingProgress {
  id: string;
  user_id: string;
  current_step: number;
  completed_steps: number[];
  is_completed: boolean;
  skipped_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const ONBOARDING_STEPS = [
  { id: 1, titleKey: 'onboarding.steps.companyProfile.title', descriptionKey: 'onboarding.steps.companyProfile.description' },
  { id: 2, titleKey: 'onboarding.steps.firstClient.title', descriptionKey: 'onboarding.steps.firstClient.description' },
  { id: 3, titleKey: 'onboarding.steps.firstOffer.title', descriptionKey: 'onboarding.steps.firstOffer.description' },
  { id: 4, titleKey: 'onboarding.steps.sendOffer.title', descriptionKey: 'onboarding.steps.sendOffer.description' },
  { id: 5, titleKey: 'onboarding.steps.exportPdf.title', descriptionKey: 'onboarding.steps.exportPdf.description' },
];

export function useOnboardingProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['onboarding_progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('id, user_id, current_step, completed_steps, is_completed, skipped_at, completed_at, created_at, updated_at')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as OnboardingProgress | null;
    },
    enabled: !!user,
  });
}

export function useCreateOnboardingProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .insert({
          user_id: user!.id,
          current_step: 1,
          completed_steps: [],
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding_progress'] });
    },
  });
}

export function useUpdateOnboardingProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<OnboardingProgress>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('onboarding_progress')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding_progress'] });
    },
  });
}

export function useCompleteOnboardingStep() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: progress } = useOnboardingProgress();

  return useMutation({
    mutationFn: async (stepId: number) => {
      if (!user) throw new Error('Not authenticated');

      const completedSteps = progress?.completed_steps || [];
      const newCompletedSteps = completedSteps.includes(stepId) 
        ? completedSteps 
        : [...completedSteps, stepId];
      
      const nextStep = Math.min(stepId + 1, ONBOARDING_STEPS.length);
      const isCompleted = newCompletedSteps.length === ONBOARDING_STEPS.length;

      if (stepId === 1 && !completedSteps.includes(1)) {
        trackEvent(ANALYTICS_EVENTS.ONBOARDING_STARTED);
      }
      if (isCompleted) {
        trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED);
      }

      const { data, error } = await supabase
        .from('onboarding_progress')
        .update({
          completed_steps: newCompletedSteps,
          current_step: nextStep,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding_progress'] });
    },
  });
}

export function useSkipOnboarding() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('onboarding_progress')
        .update({
          is_completed: true,
          skipped_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding_progress'] });
    },
  });
}
