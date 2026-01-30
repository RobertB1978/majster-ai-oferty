import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { validateFile, FILE_VALIDATION_CONFIGS } from '@/lib/fileValidation';
import { normalizeProfileData } from '@/lib/dataValidation';

export interface Profile {
  id: string;
  user_id: string;
  company_name: string;
  owner_name: string | null;
  nip: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  email_for_offers: string | null;
  bank_account: string | null;
  logo_url: string | null;
  email_subject_template: string | null;
  email_greeting: string | null;
  email_signature: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profileData: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!user?.id) throw new Error('Nie jesteś zalogowany');

      // Normalize data before saving (defensive data protection)
      const normalizedData = normalizeProfileData(profileData);

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('profiles')
          .update(normalizedData)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, ...normalizedData })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profil firmy został zapisany');
    },
    onError: (error) => {
      logger.error('Error updating profile:', error);
      toast.error('Nie udało się zapisać profilu');
    },
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('Nie jesteś zalogowany');

      // Validate file
      const validation = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      // Update profile with logo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: urlData.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Logo zostało przesłane');
    },
    onError: (error) => {
      logger.error('Error uploading logo:', error);
      const message = error instanceof Error ? error.message : 'Nie udało się przesłać logo';
      toast.error(message);
    },
  });
}
