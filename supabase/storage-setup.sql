-- Enable storage (if bucket doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'scene-photos') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('scene-photos', 'scene-photos', true);
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete photos" ON storage.objects;

-- Set up storage policies
-- Create new policies
CREATE POLICY "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'scene-photos' );

CREATE POLICY "Anyone can upload photos"
on storage.objects for insert
to public
with check ( bucket_id = 'scene-photos' );

CREATE POLICY "Anyone can update photos"
on storage.objects for update
to public
using ( bucket_id = 'scene-photos' )
with check ( bucket_id = 'scene-photos' );

CREATE POLICY "Anyone can delete photos"
on storage.objects for delete
to public
using ( bucket_id = 'scene-photos' );
