import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface AdminContentConfig {
  id: string;
  organization_id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_cta_link: string;
  feature1_title: string;
  feature1_desc: string;
  feature2_title: string;
  feature2_desc: string;
  feature3_title: string;
  feature3_desc: string;
  footer_company_name: string;
  footer_copyright: string;
  footer_description: string;
  support_email: string | null;
  phone_number: string | null;
  address: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

interface UseAdminContentConfigReturn {
  contentConfig: AdminContentConfig | null;
  isLoading: boolean;
  error: Error | null;
  updateContentConfig: (updates: Partial<AdminContentConfig>) => Promise<void>;
  isUpdating: boolean;
}

/**
 * Hook to manage admin content configuration from database
 * @param organizationId - Organization ID to fetch content for
 * @returns Content config state and update functions
 */
export function useAdminContentConfig(organizationId: string | undefined): UseAdminContentConfigReturn {
  const [contentConfig, setContentConfig] = useState<AdminContentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch content config from database
  useEffect(() => {
    if (!organizationId) return;

    const fetchContentConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('admin_content_config')
          .select('*')
          .eq('organization_id', organizationId)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // No rows found - this is OK, we'll use defaults
            logger.log('No content config found for org, using defaults');
            setContentConfig(null);
          } else {
            throw fetchError;
          }
        } else if (data) {
          setContentConfig(data as AdminContentConfig);
          logger.log('Loaded content config from database');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch content config');
        setError(error);
        logger.error('Failed to fetch admin content config:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentConfig();
  }, [organizationId]);

  // Update content config
  const updateContentConfig = async (updates: Partial<AdminContentConfig>) => {
    if (!organizationId || !contentConfig?.id) {
      throw new Error('Organization ID or content config ID not available');
    }

    try {
      setIsUpdating(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('admin_content_config')
        .update({
          ...updates,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentConfig.id)
        .eq('organization_id', organizationId);

      if (updateError) throw updateError;

      // Update local state
      setContentConfig(prev => prev ? { ...prev, ...updates } : null);
      logger.log('Updated content config successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update content config');
      setError(error);
      logger.error('Failed to update admin content config:', err);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    contentConfig,
    isLoading,
    error,
    updateContentConfig,
    isUpdating,
  };
}
