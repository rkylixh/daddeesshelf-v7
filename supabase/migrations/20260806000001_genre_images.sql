-- Genre and Subgenre image URLs table
CREATE TABLE IF NOT EXISTS public.genre_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre TEXT NOT NULL,
  subgenre TEXT,
  image_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint: one image per genre (subgenre NULL) or per genre+subgenre pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_genre_images_unique
  ON public.genre_images (genre, (COALESCE(subgenre, '')));

CREATE INDEX IF NOT EXISTS idx_genre_images_genre ON public.genre_images (genre);

ALTER TABLE public.genre_images ENABLE ROW LEVEL SECURITY;

-- Public can read genre images
DROP POLICY IF EXISTS "public_read_genre_images" ON public.genre_images;
CREATE POLICY "public_read_genre_images"
  ON public.genre_images
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users (admins) can manage genre images
DROP POLICY IF EXISTS "authenticated_manage_genre_images" ON public.genre_images;
CREATE POLICY "authenticated_manage_genre_images"
  ON public.genre_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
