import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Subcontractor {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  location_city: string | null;
  location_lat: number | null;
  location_lng: number | null;
  hourly_rate: number | null;
  is_public: boolean;
  avatar_url: string | null;
  portfolio_images: string[];
  rating: number;
  review_count: number;
  created_at: string;
}

export interface SubcontractorService {
  id: string;
  subcontractor_id: string;
  service_name: string;
  price_per_unit: number | null;
  unit: string;
  created_at: string;
}

export interface SubcontractorReview {
  id: string;
  subcontractor_id: string;
  reviewer_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function useMySubcontractors() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subcontractors', 'mine'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('subcontractors')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Could not fetch subcontractors:', error.message);
          return [] as Subcontractor[];
        }
        return data as Subcontractor[];
      } catch (err) {
        console.error('Error fetching subcontractors:', err);
        return [] as Subcontractor[];
      }
    },
    enabled: !!user,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function usePublicSubcontractors(filters?: { city?: string; minRating?: number }) {
  return useQuery({
    queryKey: ['subcontractors', 'public', filters],
    queryFn: async () => {
      try {
        let query = supabase
          .from('subcontractors')
          .select('*')
          .eq('is_public', true)
          .order('rating', { ascending: false });

        if (filters?.city) {
          query = query.ilike('location_city', `%${filters.city}%`);
        }
        if (filters?.minRating) {
          query = query.gte('rating', filters.minRating);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('Could not fetch public subcontractors:', error.message);
          return [] as Subcontractor[];
        }
        return data as Subcontractor[];
      } catch (err) {
        console.error('Error fetching public subcontractors:', err);
        return [] as Subcontractor[];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useSubcontractor(id: string) {
  return useQuery({
    queryKey: ['subcontractor', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Subcontractor;
    },
    enabled: !!id,
  });
}

export function useAddSubcontractor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (subcontractor: Omit<Subcontractor, 'id' | 'user_id' | 'created_at' | 'rating' | 'review_count'>) => {
      const { data, error } = await supabase
        .from('subcontractors')
        .insert({
          ...subcontractor,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontractors'] });
      toast.success('Podwykonawca dodany');
    },
    onError: () => {
      toast.error('Błąd podczas dodawania podwykonawcy');
    },
  });
}

export function useUpdateSubcontractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subcontractor> & { id: string }) => {
      const { data, error } = await supabase
        .from('subcontractors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontractors'] });
      toast.success('Podwykonawca zaktualizowany');
    },
  });
}

export function useSubcontractorServices(subcontractorId: string) {
  return useQuery({
    queryKey: ['subcontractor_services', subcontractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcontractor_services')
        .select('*')
        .eq('subcontractor_id', subcontractorId);

      if (error) throw error;
      return data as SubcontractorService[];
    },
    enabled: !!subcontractorId,
  });
}

export function useSubcontractorReviews(subcontractorId: string) {
  return useQuery({
    queryKey: ['subcontractor_reviews', subcontractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcontractor_reviews')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubcontractorReview[];
    },
    enabled: !!subcontractorId,
  });
}

export function useAddSubcontractorReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ subcontractorId, rating, comment }: {
      subcontractorId: string;
      rating: number;
      comment?: string;
    }) => {
      const { data, error } = await supabase
        .from('subcontractor_reviews')
        .insert({
          subcontractor_id: subcontractorId,
          reviewer_user_id: user!.id,
          rating,
          comment,
        })
        .select()
        .single();

      if (error) throw error;

      // Update average rating
      const { data: reviews } = await supabase
        .from('subcontractor_reviews')
        .select('rating')
        .eq('subcontractor_id', subcontractorId);

      if (reviews) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await supabase
          .from('subcontractors')
          .update({ rating: avgRating, review_count: reviews.length })
          .eq('id', subcontractorId);
      }

      return data;
    },
    onSuccess: (_, { subcontractorId }) => {
      queryClient.invalidateQueries({ queryKey: ['subcontractor_reviews', subcontractorId] });
      queryClient.invalidateQueries({ queryKey: ['subcontractors'] });
      toast.success('Opinia dodana');
    },
  });
}
