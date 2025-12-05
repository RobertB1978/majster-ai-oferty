import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProjectPhoto {
  id: string;
  project_id: string;
  user_id: string;
  photo_url: string;
  file_name: string;
  analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed';
  analysis_result: any;
  created_at: string;
}

export function useProjectPhotos(projectId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project_photos', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_photos')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectPhoto[];
    },
    enabled: !!user && !!projectId,
  });
}

export function useUploadProjectPhoto() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, file }: { projectId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${projectId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(fileName);

      const { data, error } = await supabase
        .from('project_photos')
        .insert({
          project_id: projectId,
          user_id: user!.id,
          photo_url: publicUrl,
          file_name: file.name,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project_photos', projectId] });
      toast.success('Zdjęcie przesłane');
    },
    onError: () => {
      toast.error('Błąd podczas przesyłania zdjęcia');
    },
  });
}

export function useAnalyzePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, projectId, imageUrl, projectName }: { 
      photoId: string; 
      projectId: string;
      imageUrl: string; 
      projectName: string;
    }) => {
      // Update status to analyzing
      await supabase
        .from('project_photos')
        .update({ analysis_status: 'analyzing' })
        .eq('id', photoId);

      const { data, error } = await supabase.functions.invoke('analyze-photo', {
        body: { imageUrl, projectName }
      });

      if (error) throw error;

      // Save analysis result
      await supabase
        .from('project_photos')
        .update({ 
          analysis_status: 'completed',
          analysis_result: data.analysis 
        })
        .eq('id', photoId);

      return { photoId, projectId, analysis: data.analysis };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['project_photos', result.projectId] });
      toast.success('Analiza zakończona');
    },
    onError: async (_, { photoId, projectId }) => {
      await supabase
        .from('project_photos')
        .update({ analysis_status: 'failed' })
        .eq('id', photoId);
      toast.error('Błąd podczas analizy zdjęcia');
    },
  });
}

export function useDeleteProjectPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, projectId }: { photoId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['project_photos', result.projectId] });
      toast.success('Zdjęcie usunięte');
    },
  });
}
