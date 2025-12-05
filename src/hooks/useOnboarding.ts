import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  { id: 1, title: 'Profil firmy', description: 'Dodaj logo i dane kontaktowe firmy' },
  { id: 2, title: 'Pierwszy klient', description: 'Dodaj swojego pierwszego klienta' },
  { id: 3, title: 'Pierwszy projekt', description: 'Utwórz pierwszy projekt' },
  { id: 4, title: 'Pierwsza wycena', description: 'Stwórz wycenę z pozycjami' },
  { id: 5, title: 'Eksport PDF', description: 'Wygeneruj ofertę PDF' },
];

export function useOnboardingProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['onboarding_progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
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
