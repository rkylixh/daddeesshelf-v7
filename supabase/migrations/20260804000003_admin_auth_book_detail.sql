-- ============================================================
-- Daddee's Shelf — Admin Auth & Book Detail Enhancement
-- 20260804000003_admin_auth_book_detail.sql
-- Additive only — no data deletion, no table recreation
-- ============================================================

-- ── 1. Add pin_hash column to admin_users (replaces customer_pin for auth) ──
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS pin_hash TEXT DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS pin_set BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Fix roles: @maduday is Developer, not Administrator ──
UPDATE public.admin_users
  SET role = 'Developer'
  WHERE tiktok_handle = 'maduday'
     OR tiktok_handle = '@maduday';

-- ── 3. Ensure all required admin accounts exist with correct roles ──
-- Owner
INSERT INTO public.admin_users (tiktok_handle, display_name, role, customer_pin, pin_hash, pin_set, is_active)
VALUES ('daddees.shelf', 'Daddee''s Shelf', 'Owner', '', '', false, true)
ON CONFLICT (tiktok_handle) DO UPDATE
  SET role = 'Owner', is_active = true;

-- Developer
INSERT INTO public.admin_users (tiktok_handle, display_name, role, customer_pin, pin_hash, pin_set, is_active)
VALUES ('maduday', 'Maduday', 'Developer', '', '', false, true)
ON CONFLICT (tiktok_handle) DO UPDATE
  SET role = 'Developer', is_active = true;

-- Administrators
INSERT INTO public.admin_users (tiktok_handle, display_name, role, customer_pin, pin_hash, pin_set, is_active)
VALUES
  ('ikaynah26', 'Ikaynah', 'Administrator', '', '', false, true),
  ('maximum_violet', 'Maximum Violet', 'Administrator', '', '', false, true),
  ('reseldt', 'Reseldt', 'Administrator', '', '', false, true),
  ('tdleser', 'Tdleser', 'Administrator', '', '', false, true),
  ('internalerror502', 'InternalError502', 'Administrator', '', '', false, true)
ON CONFLICT (tiktok_handle) DO UPDATE
  SET role = 'Administrator', is_active = true;

-- ── 4. Allow anon to update admin_users (for PIN creation on first login) ──
DROP POLICY IF EXISTS "admin_users_update_anon" ON public.admin_users;
CREATE POLICY "admin_users_update_anon"
  ON public.admin_users FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ── 5. Book detail enhancement columns ──
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS synopsis TEXT DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS goodreads_ratings_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reader_tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS why_readers_love TEXT DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS emotional_intensity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS romance_level INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS worldbuilding_complexity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pace INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS humor INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS darkness INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS action INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quotes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reading_age TEXT DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS content_warnings TEXT DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS spice_level INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS goodreads_url TEXT DEFAULT ''::text;

-- Backfill spice_level from spice_rating if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'books'
      AND column_name = 'spice_rating'
  ) THEN
    UPDATE public.books
      SET spice_level = spice_rating
      WHERE spice_level = 0 AND spice_rating > 0;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'spice_rating backfill skipped: %', SQLERRM;
END $$;

-- Backfill goodreads_url from goodreads_link if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'books'
      AND column_name = 'goodreads_link'
  ) THEN
    UPDATE public.books
      SET goodreads_url = goodreads_link
      WHERE (goodreads_url IS NULL OR goodreads_url = '')
        AND goodreads_link IS NOT NULL
        AND goodreads_link != '';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'goodreads_link backfill skipped: %', SQLERRM;
END $$;

-- ── 6. Audit log: ensure action column exists for book detail edits ──
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS action TEXT DEFAULT ''::text;
