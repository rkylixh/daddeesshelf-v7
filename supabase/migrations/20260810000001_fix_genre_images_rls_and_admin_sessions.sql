-- ============================================================
-- Fix genre_images anon write (admin uses PIN auth, not Supabase Auth)
-- Fix admin_sessions duplicate rows inflating online count
-- 20260810000001_fix_genre_images_rls_and_admin_sessions.sql
-- ============================================================

-- ── 1. genre_images: allow anon writes (same pattern as books) ──
DROP POLICY IF EXISTS "authenticated_manage_genre_images" ON public.genre_images;
DROP POLICY IF EXISTS "anon_all_genre_images" ON public.genre_images;
DROP POLICY IF EXISTS "public_all_genre_images" ON public.genre_images;

CREATE POLICY "anon_all_genre_images"
  ON public.genre_images
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_manage_genre_images"
  ON public.genre_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Stable unique key so upserts work (NULLs in subgenre broke plain unique)
ALTER TABLE public.genre_images
  ADD COLUMN IF NOT EXISTS subgenre_key TEXT
  GENERATED ALWAYS AS (COALESCE(subgenre, '')) STORED;

DROP INDEX IF EXISTS idx_genre_images_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_genre_images_unique
  ON public.genre_images (genre, subgenre_key);

-- Also expose as a named unique constraint for PostgREST upsert onConflict
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'genre_images_genre_subgenre_key_uniq'
  ) THEN
    ALTER TABLE public.genre_images
      ADD CONSTRAINT genre_images_genre_subgenre_key_uniq UNIQUE USING INDEX idx_genre_images_unique;
  END IF;
EXCEPTION
  WHEN others THEN
    -- Index may already back a constraint or conflict; safe to continue
    NULL;
END $$;

-- ── 2. admin_sessions: one row per admin, prune duplicates ──
DELETE FROM public.admin_sessions a
USING public.admin_sessions b
WHERE a.admin_id IS NOT NULL
  AND a.admin_id = b.admin_id
  AND a.last_seen_at < b.last_seen_at;

DELETE FROM public.admin_sessions a
USING public.admin_sessions b
WHERE a.admin_id IS NOT NULL
  AND a.admin_id = b.admin_id
  AND a.id > b.id
  AND a.last_seen_at = b.last_seen_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_sessions_admin_id_unique
  ON public.admin_sessions (admin_id)
  WHERE admin_id IS NOT NULL;

-- ── 3. Enable realtime for admin chat ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'admin_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_messages;
  END IF;
END $$;
