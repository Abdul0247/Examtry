
-- Drop the broad public read policy that allowed anyone to list all files
DROP POLICY IF EXISTS "Public read exam media" ON storage.objects;

-- Allow public access to objects only when fetched by full path (not via listing).
-- Supabase storage uses SELECT for both list and download; making the bucket public
-- in storage.buckets already permits direct downloads via getPublicUrl. We restrict
-- broad SELECT to authenticated owners to prevent enumeration.
CREATE POLICY "Owners can list own exam media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exam-media'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
