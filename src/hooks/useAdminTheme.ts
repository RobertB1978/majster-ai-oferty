import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminThemeConfig {
  id: string;
  organization_id: string;
  primary_hue: number;
  primary_saturation: number;
  primary_lightness: number;
  accent_hue: number;
  border_radius: number;
  font_size: number;
  font_family: string;
  spacing: number;
  version: number;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

interface UseAdminThemeResult {
  theme: Partial<AdminThemeConfig> | null;
  loading: boolean;
  error: Error | null;
  updateTheme: (updates: Partial<AdminThemeConfig>) => Promise<void>;
  applyTheme: (themeData: Partial<AdminThemeConfig>) => void;
  resetTheme: () => void;
}

const DEFAULT_THEME = {
  primary_hue: 210,
  primary_saturation: 100,
  primary_lightness: 50,
  accent_hue: 265,
  border_radius: 8,
  font_size: 14,
  font_family: 'Inter',
  spacing: 4,
};

export function useAdminTheme(organizationId: string | null): UseAdminThemeResult {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Partial<AdminThemeConfig> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionRef = useRef<any>(null);

  // Fetch theme from database
  const fetchTheme = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('admin_theme_config')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setTheme(data);
      } else {
        // No theme found, use defaults
        setTheme(DEFAULT_THEME);
      }
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch theme');
      setError(error);
      console.error('Error fetching admin theme:', error);
      setTheme(DEFAULT_THEME);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Set up realtime subscription
  useEffect(() => {
    if (!organizationId) return;

    fetchTheme();

    // Subscribe to changes
    const subscription = supabase
      .from('admin_theme_config')
      .on('*', (payload) => {
        if (payload.new?.organization_id === organizationId) {
          setTheme(payload.new as AdminThemeConfig);
        }
      })
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeSubscription(subscription);
      }
    };
  }, [organizationId, fetchTheme, t]);

  // Apply theme to DOM
  const applyTheme = useCallback((themeData: Partial<AdminThemeConfig>) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    if (themeData.primary_hue !== undefined && themeData.primary_saturation !== undefined && themeData.primary_lightness !== undefined) {
      root.style.setProperty(
        '--primary',
        `${themeData.primary_hue} ${themeData.primary_saturation}% ${themeData.primary_lightness}%`
      );
    }

    if (themeData.accent_hue !== undefined) {
      root.style.setProperty('--accent', `${themeData.accent_hue} 83% 54%`);
    }

    if (themeData.border_radius !== undefined) {
      root.style.setProperty('--radius', `${themeData.border_radius}px`);
    }

    if (themeData.font_size !== undefined) {
      root.style.fontSize = `${themeData.font_size}px`;
    }

    if (themeData.font_family) {
      root.style.fontFamily = `${themeData.font_family}, system-ui, sans-serif`;
    }
  }, []);

  // Update theme in database
  const updateTheme = useCallback(
    async (updates: Partial<AdminThemeConfig>) => {
      if (!organizationId) {
        toast.error('Nie można zapisać motywu');
        return;
      }

      try {
        const { error: updateError } = await supabase
          .from('admin_theme_config')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', organizationId);

        if (updateError) throw updateError;

        setTheme((prev) => (prev ? { ...prev, ...updates } : updates));
        applyTheme({ ...theme, ...updates });
        toast.success(t('messages.themeSaved'));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update theme');
        setError(error);
        console.error('Error updating admin theme:', error);
        toast.error(t('errors.themeSaveFailed'));
      }
    },
    [organizationId, theme, applyTheme, t]
  );

  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME);
    document.documentElement.style.cssText = '';
    toast.info(t('success.updated'));
  }, [t]);

  return {
    theme,
    loading,
    error,
    updateTheme,
    applyTheme,
    resetTheme,
  };
}
