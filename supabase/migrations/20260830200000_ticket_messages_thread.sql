-- ============================================================
-- Daddee's Shelf — Ticket Messages (Reply Thread)
-- 20260830200000_ticket_messages_thread.sql
-- Additive only — no data deletion, no table recreation
-- ============================================================

-- ── 1. Create ticket_messages table ──
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'customer', -- 'customer' or 'admin'
  sender_name TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created ON public.ticket_messages(created_at DESC);

-- ── 2. Enable RLS ──
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- ── 3. RLS Policies ──
-- Allow anon to SELECT (admin reads via anon key pattern)
DROP POLICY IF EXISTS "ticket_messages_select_anon" ON public.ticket_messages;
CREATE POLICY "ticket_messages_select_anon"
ON public.ticket_messages FOR SELECT
  TO anon
  USING (true);

-- Allow anon to INSERT (customers and admins post via anon key)
DROP POLICY IF EXISTS "ticket_messages_insert_anon" ON public.ticket_messages;
CREATE POLICY "ticket_messages_insert_anon"
ON public.ticket_messages FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated to SELECT
DROP POLICY IF EXISTS "ticket_messages_select_auth" ON public.ticket_messages;
CREATE POLICY "ticket_messages_select_auth"
ON public.ticket_messages FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated to INSERT
DROP POLICY IF EXISTS "ticket_messages_insert_auth" ON public.ticket_messages;
CREATE POLICY "ticket_messages_insert_auth"
ON public.ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);
