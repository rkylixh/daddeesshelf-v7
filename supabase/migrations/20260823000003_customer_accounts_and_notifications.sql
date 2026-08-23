-- ============================================================
-- Daddee's Shelf — Customer Accounts + Notifications
-- 20260823000003_customer_accounts_and_notifications.sql
-- Additive only — no data deletion, no table recreation
-- ============================================================

-- ── 1. Add username and customer_id columns to customers ──
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS customer_id TEXT UNIQUE;

-- ── 2. Create customer_notifications table ────────────────
CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  tiktok_handle TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'on_hand',
  is_read BOOLEAN NOT NULL DEFAULT false,
  order_ref TEXT DEFAULT '',
  book_title TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. RLS for customer_notifications ────────────────────
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_notifications_anon_select" ON public.customer_notifications;
CREATE POLICY "customer_notifications_anon_select"
  ON public.customer_notifications FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "customer_notifications_anon_insert" ON public.customer_notifications;
CREATE POLICY "customer_notifications_anon_insert"
  ON public.customer_notifications FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "customer_notifications_anon_update" ON public.customer_notifications;
CREATE POLICY "customer_notifications_anon_update"
  ON public.customer_notifications FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ── 4. Index for fast lookup by customer_id ──────────────
CREATE INDEX IF NOT EXISTS idx_customer_notifications_customer_id
  ON public.customer_notifications (customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_notifications_tiktok_handle
  ON public.customer_notifications (tiktok_handle);

-- ── 5. Index for customers username lookup ───────────────
CREATE INDEX IF NOT EXISTS idx_customers_username
  ON public.customers (username);

CREATE INDEX IF NOT EXISTS idx_customers_customer_id
  ON public.customers (customer_id);
