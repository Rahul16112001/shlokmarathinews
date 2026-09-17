-- 1. Modify the existing videos table
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS video_type TEXT DEFAULT 'NORMAL_VIDEO' CHECK (video_type IN ('NORMAL_VIDEO', 'SHORT_VIDEO')),
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Create the Storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('video-thumbnails', 'video-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage RLS for 'videos' bucket
CREATE POLICY "Public can view videos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Admins can upload videos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated' AND public.is_admin());

CREATE POLICY "Admins can update videos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'videos' AND auth.role() = 'authenticated' AND public.is_admin());

CREATE POLICY "Admins can delete videos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'videos' AND auth.role() = 'authenticated' AND public.is_admin());

-- 4. Set up Storage RLS for 'video-thumbnails' bucket
CREATE POLICY "Public can view video-thumbnails" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'video-thumbnails');

CREATE POLICY "Admins can upload video-thumbnails" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'video-thumbnails' AND auth.role() = 'authenticated' AND public.is_admin());

CREATE POLICY "Admins can update video-thumbnails" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'video-thumbnails' AND auth.role() = 'authenticated' AND public.is_admin());

CREATE POLICY "Admins can delete video-thumbnails" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'video-thumbnails' AND auth.role() = 'authenticated' AND public.is_admin());
