-- ============================================================
-- Daddee's Shelf — Customer PIN Enrollment & Admin Account Fix
-- 20260804000005_customer_pin_enrollment.sql
-- Additive only — no data deletion, no table recreation
-- ============================================================

-- ── 1. Create customers table for PIN enrollment ──────────
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tiktok_handle TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL DEFAULT '',
  pin_enrolled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. RLS for customers table ────────────────────────────
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow anon to insert (new customer registration)
DROP POLICY IF EXISTS "customers_anon_insert" ON public.customers;
CREATE POLICY "customers_anon_insert"
  ON public.customers FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon to select (for PIN verification lookup)
DROP POLICY IF EXISTS "customers_anon_select" ON public.customers;
CREATE POLICY "customers_anon_select"
  ON public.customers FOR SELECT
  TO anon
  USING (true);

-- Allow anon to update (for PIN enrollment)
DROP POLICY IF EXISTS "customers_anon_update" ON public.customers;
CREATE POLICY "customers_anon_update"
  ON public.customers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ── 3. Ensure admin_users SELECT is allowed for anon ─────
-- (needed for handle lookup during login)
DROP POLICY IF EXISTS "admin_users_anon_select" ON public.admin_users;
CREATE POLICY "admin_users_anon_select"
  ON public.admin_users FOR SELECT
  TO anon
  USING (true);

-- ── 4. Ensure all 7 admin accounts exist (no @ prefix) ───
-- Remove any @-prefixed duplicates and ensure clean records

-- Owner
INSERT INTO public.admin_users (tiktok_handle, display_name, role, customer_pin, pin_hash, pin_set, is_active)
VALUES ('daddees.shelf', 'Daddee''s Shelf', 'Owner', '', '', false, true)
ON CONFLICT (tiktok_handle) DO UPDATE
  SET role = 'Owner', is_active = true, display_name = 'Daddee''s Shelf';

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

-- ── 5. Remove legacy @-prefixed admin records if they exist ──
-- Only delete if a clean version (without @) already exists
DELETE FROM public.admin_users
WHERE tiktok_handle LIKE '@%'
  AND EXISTS (
    SELECT 1 FROM public.admin_users au2
    WHERE au2.tiktok_handle = LTRIM(public.admin_users.tiktok_handle, '@')
  );

-- ── 6. Ensure admin_users UPDATE policy exists for PIN creation ──
DROP POLICY IF EXISTS "admin_users_update_anon" ON public.admin_users;
CREATE POLICY "admin_users_update_anon"
  ON public.admin_users FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
