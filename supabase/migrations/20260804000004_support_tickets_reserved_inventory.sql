-- ============================================================
-- Daddee's Shelf — Support Tickets RLS & Reserved Inventory
-- 20260804000004_support_tickets_reserved_inventory.sql
-- Additive only — no data deletion, no table recreation
-- ============================================================

-- ── 1. Support Tickets: ensure table exists with all columns ──
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  tiktok_handle TEXT DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'New',
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. Enable RLS on support_tickets ──
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- ── 3. RLS Policies for support_tickets ──
-- Allow anyone (anon) to INSERT (contact form submissions)
DROP POLICY IF EXISTS "support_tickets_insert_anon" ON public.support_tickets;
CREATE POLICY "support_tickets_insert_anon"
  ON public.support_tickets FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert
DROP POLICY IF EXISTS "support_tickets_insert_auth" ON public.support_tickets;
CREATE POLICY "support_tickets_insert_auth"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow anon to SELECT (admin reads via anon key in sessionStorage auth pattern)
DROP POLICY IF EXISTS "support_tickets_select_anon" ON public.support_tickets;
CREATE POLICY "support_tickets_select_anon"
  ON public.support_tickets FOR SELECT
  TO anon
  USING (true);

-- Allow anon to UPDATE (admin updates via anon key)
DROP POLICY IF EXISTS "support_tickets_update_anon" ON public.support_tickets;
CREATE POLICY "support_tickets_update_anon"
  ON public.support_tickets FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ── 4. Books: add visibility column if not present ──
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'Available';

-- ── 5. Update books where reserved > 0 to set visibility = 'Reserved' ──
-- This is a one-time backfill for existing data where reserved column > 0
-- and inventory is fully consumed by reservations
UPDATE public.books
  SET visibility = 'Reserved'
  WHERE reserved > 0
    AND (inventory - reserved) <= 0
    AND (visibility IS NULL OR visibility = 'Available');

-- ── 6. Audit logs: ensure anon can insert (for admin audit trail) ──
DROP POLICY IF EXISTS "audit_logs_insert_anon" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_anon"
  ON public.audit_logs FOR INSERT
  TO anon
  WITH CHECK (true);

-- ── 7. Reader comments: ensure anon can insert ──
DROP POLICY IF EXISTS "reader_comments_insert_anon" ON public.reader_comments;
CREATE POLICY "reader_comments_insert_anon"
  ON public.reader_comments FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "reader_comments_select_published" ON public.reader_comments;
CREATE POLICY "reader_comments_select_published"
  ON public.reader_comments FOR SELECT
  TO anon
  USING (is_published = true);
