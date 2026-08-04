-- ============================================================
-- Daddee's Shelf — Store Credits & Customer Management
-- 20260804000007_store_credits_customer_mgmt.sql
-- Additive only — no data deletion, no table recreation
-- ============================================================

-- ── 1. Store Credits table ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tiktok_handle TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  issued_by TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',  -- Active | Used | Expired | Cancelled
  order_ref TEXT DEFAULT NULL,            -- linked order ref (if refund-based)
  used_on_order_ref TEXT DEFAULT NULL,    -- order ref where credit was applied
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. RLS for store_credits ──────────────────────────────
ALTER TABLE public.store_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_credits_anon_select" ON public.store_credits;
CREATE POLICY "store_credits_anon_select"
  ON public.store_credits FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "store_credits_anon_insert" ON public.store_credits;
CREATE POLICY "store_credits_anon_insert"
  ON public.store_credits FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "store_credits_anon_update" ON public.store_credits;
CREATE POLICY "store_credits_anon_update"
  ON public.store_credits FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ── 3. Add store_credit_applied column to orders ──────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS store_credit_applied NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS store_credit_id UUID DEFAULT NULL;

-- ── 4. Ensure customers table has all needed columns ──────
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;
