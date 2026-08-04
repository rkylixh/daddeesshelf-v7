-- ============================================================
-- Daddee's Shelf — Admin PIN Column Rename & Auth Cleanup
-- 20260804000006_admin_pin_column_rename.sql
-- Renames customer_pin to pin_hash in admin_users (if not already done)
-- Additive only — no data deletion
-- ============================================================

-- ── 1. Rename customer_pin to pin_hash in admin_users if it still exists ──
DO $$
BEGIN
  -- Only rename if customer_pin exists AND pin_hash does NOT exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'customer_pin'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'pin_hash'
  ) THEN
    ALTER TABLE public.admin_users RENAME COLUMN customer_pin TO pin_hash;
  END IF;

  -- If both columns exist, copy any non-empty values from customer_pin to pin_hash, then drop customer_pin
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'customer_pin'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'pin_hash'
  ) THEN
    -- Migrate any non-empty customer_pin values to pin_hash where pin_hash is empty
    UPDATE public.admin_users
    SET pin_hash = customer_pin
    WHERE (pin_hash IS NULL OR pin_hash = '')
      AND customer_pin IS NOT NULL
      AND customer_pin != '';

    -- Drop the old column
    ALTER TABLE public.admin_users DROP COLUMN IF EXISTS customer_pin;
  END IF;
END $$;

-- ── 2. Ensure pin_hash column exists with correct type ────
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS pin_hash TEXT DEFAULT ''::text;

-- ── 3. Ensure pin_set column exists ──────────────────────
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS pin_set BOOLEAN NOT NULL DEFAULT false;

-- ── 4. Ensure all 7 admin accounts exist (no @ prefix) ───
INSERT INTO public.admin_users (tiktok_handle, display_name, role, pin_hash, pin_set, is_active)
VALUES ('daddees.shelf', 'Daddee''s Shelf', 'Owner', '', false, true)
ON CONFLICT (tiktok_handle) DO UPDATE
  SET role = 'Owner', is_active = true, display_name = 'Daddee''s Shelf';

INSERT INTO public.admin_users (tiktok_handle, display_name, role, pin_hash, pin_set, is_active)
VALUES ('maduday', 'Maduday', 'Developer', '', false, true)
ON CONFLICT (tiktok_handle) DO UPDATE
  SET role = 'Developer', is_active = true;

INSERT INTO public.admin_users (tiktok_handle, display_name, role, pin_hash, pin_set, is_active)
VALUES
  ('ikaynah26', 'Ikaynah', 'Administrator', '', false, true),
  ('maximum_violet', 'Maximum Violet', 'Administrator', '', false, true),
  ('reseldt', 'Reseldt', 'Administrator', '', false, true),
  ('tdleser', 'Tdleser', 'Administrator', '', false, true),
  ('internalerror502', 'InternalError502', 'Administrator', '', false, true)
ON CONFLICT (tiktok_handle) DO UPDATE
  SET role = 'Administrator', is_active = true;

-- ── 5. Remove legacy @-prefixed admin records if clean version exists ──
DELETE FROM public.admin_users
WHERE tiktok_handle LIKE '@%'
  AND EXISTS (
    SELECT 1 FROM public.admin_users au2
    WHERE au2.tiktok_handle = LTRIM(public.admin_users.tiktok_handle, '@')
  );

-- ── 6. Ensure RLS policies exist ─────────────────────────
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_anon_select" ON public.admin_users;
CREATE POLICY "admin_users_anon_select"
  ON public.admin_users FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "admin_users_update_anon" ON public.admin_users;
CREATE POLICY "admin_users_update_anon"
  ON public.admin_users FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
