import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminSystemSettings {
  id: string;
  organization_id: string;
  email_enabled: boolean;
  smtp_host: string | null;
  smtp_port: number | null;
  email_from_name: string | null;
  email_from_address: string | null;
  registration_enabled: boolean;
  maintenance_mode: boolean;
  api_enabled: boolean;
  ai_enabled: boolean;
  voice_enabled: boolean;
  ocr_enabled: boolean;
  max_clients_per_user: number;
  max_projects_per_user: number;
  max_storage_per_user: number;
  session_timeout_minutes: number;
  require_email_verification: boolean;
  two_factor_enabled: boolean;
  rate_limit_requests: number;
  rate_limit_window_seconds: number;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

interface UseAdminSettingsResult {
  settings: Partial<AdminSystemSettings> | null;
  loading: boolean;
  error: Error | null;
  updateSettings: (updates: Partial<AdminSystemSettings>) => Promise<void>;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS = {
  email_enabled: true,
  smtp_host: '',
  smtp_port: 587,
  email_from_name: 'Majster.AI',
  email_from_address: 'kontakt.majsterai@gmail.com',
  registration_enabled: true,
  maintenance_mode: false,
  api_enabled: true,
  ai_enabled: true,
  voice_enabled: true,
  ocr_enabled: true,
  max_clients_per_user: 1000,
  max_projects_per_user: 500,
  max_storage_per_user: 10737418240, // 10GB
  session_timeout_minutes: 30,
  require_email_verification: true,
  two_factor_enabled: false,
  rate_limit_requests: 100,
  rate_limit_window_seconds: 60,
};

export function useAdminSettings(organizationId: string | null): UseAdminSettingsResult {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Partial<AdminSystemSettings> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionRef = useRef<any>(null);

  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('admin_system_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setSettings(data);
      } else {
        // No settings found, use defaults
        setSettings(DEFAULT_SETTINGS);
      }
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch settings');
      setError(error);
      console.error('Error fetching admin settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Set up realtime subscription
  useEffect(() => {
    if (!organizationId) return;

    fetchSettings();

    // Subscribe to changes
    const subscription = supabase
      .from('admin_system_settings')
      .on('*', (payload) => {
        if (payload.new?.organization_id === organizationId) {
          setSettings(payload.new as AdminSystemSettings);
        }
      })
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeSubscription(subscription);
      }
    };
  }, [organizationId, fetchSettings]);

  // Update settings in database
  const updateSettings = useCallback(
    async (updates: Partial<AdminSystemSettings>) => {
      if (!organizationId || !settings) {
        toast.error('Nie można zapisać ustawień');
        return;
      }

      try {
        const { error: updateError } = await supabase
          .from('admin_system_settings')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', organizationId);

        if (updateError) throw updateError;

        setSettings((prev) => (prev ? { ...prev, ...updates } : updates));
        toast.success(t('messages.settingsSaved'));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update settings');
        setError(error);
        console.error('Error updating admin settings:', error);
        toast.error(t('errors.settingsSaveFailed'));
      }
    },
    [organizationId, settings, t]
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    toast.info(t('success.updated'));
  }, [t]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
  };
}
