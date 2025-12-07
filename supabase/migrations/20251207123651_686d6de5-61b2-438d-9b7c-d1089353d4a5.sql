-- Make project-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'project-photos';

-- Add RLS policies for project-photos bucket
CREATE POLICY "Users can view their own project photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own project photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own project photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);