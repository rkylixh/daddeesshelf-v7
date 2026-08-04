-- Daddee's Shelf — Revision 6 Schema Update
-- Adds: admin_users table, updates orders table with new fields and status enum,
--       adds contact_number, shipping_address, preferred_courier, shipment_batch columns

-- ============================================================
-- 1. UPDATE ORDER STATUS ENUM (add new statuses)
-- ============================================================
DO $$
BEGIN
  -- Add new status values if they don't exist
  BEGIN
    ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'Pending Payment Verification';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'Payment Verified';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'Supplier Ordered';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'In Transit';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'Arrived';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'Completed';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================
-- 2. ADD MISSING COLUMNS TO ORDERS TABLE
-- ============================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS contact_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shipping_address TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS preferred_courier TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shipment_batch TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';

-- ============================================================
-- 3. CREATE ADMIN USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tiktok_handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'Administrator',
  customer_pin TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. SEED DEFAULT ADMIN USERS
-- ============================================================
INSERT INTO public.admin_users (tiktok_handle, display_name, role, customer_pin)
VALUES
  ('@daddees.shelf', 'Daddee''s Shelf', 'Owner', ''),
  ('@ikaynah26', 'Ikaynah', 'Administrator', ''),
  ('@maduday', 'Maduday', 'Administrator', ''),
  ('@maximum_violet', 'Maximum Violet', 'Administrator', ''),
  ('@reseldt', 'Reseldt', 'Administrator', ''),
  ('@tdleser', 'Tdleser', 'Administrator', ''),
  ('@internalerror502', 'InternalError502', 'Developer', '')
ON CONFLICT (tiktok_handle) DO NOTHING;

-- ============================================================
-- 5. RLS POLICIES FOR ADMIN USERS
-- ============================================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
CREATE POLICY "admin_users_select"
  ON public.admin_users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admin_users_update" ON public.admin_users;
CREATE POLICY "admin_users_update"
  ON public.admin_users FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 6. UPDATE READER_COMMENTS RLS (ensure insert allowed)
-- ============================================================
ALTER TABLE public.reader_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reader_comments_insert" ON public.reader_comments;
CREATE POLICY "reader_comments_insert"
  ON public.reader_comments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "reader_comments_select_published" ON public.reader_comments;
CREATE POLICY "reader_comments_select_published"
  ON public.reader_comments FOR SELECT
  USING (is_published = true OR auth.role() = 'authenticated');

-- ============================================================
-- 7. UPDATE ORDERS RLS (ensure insert allowed for customers)
-- ============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert"
  ON public.orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own"
  ON public.orders FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin"
  ON public.orders FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 8. INDEX FOR ADMIN USERS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_admin_users_tiktok_handle ON public.admin_users(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_orders_ref_number ON public.orders(ref_number);
CREATE INDEX IF NOT EXISTS idx_reader_comments_published ON public.reader_comments(is_published);
