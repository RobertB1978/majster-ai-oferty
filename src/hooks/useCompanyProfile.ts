/**
 * PR-05: Hook dla tabeli company_profiles (dane wydawcy PDF)
 * Oddzielony od useProfile (email settings) dla czystości danych.
 * RLS: user_id = auth.uid() — tenant isolation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface CompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  nip: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  bank_account: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export type CompanyProfileFormData = Omit<CompanyProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useCompanyProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['company_profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as CompanyProfile | null;
    },
    enabled: !!user?.id,
  });
}

export function useUpsertCompanyProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (formData: Partial<CompanyProfileFormData>) => {
      if (!user?.id) throw new Error(t('auth.notLoggedIn', 'Nie jesteś zalogowany'));

      const { data: existing } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('company_profiles')
          .update(formData)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('company_profiles')
          .insert({ user_id: user.id, company_name: formData.company_name ?? '', ...formData })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_profile'] });
      toast.success(t('companyProfile.saveProfile'));
    },
    onError: (error) => {
      console.error('Error saving company profile:', error);
      toast.error(t('companyProfile.saveFailed'));
    },
  });
}
