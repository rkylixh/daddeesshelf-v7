-- ============================================================
-- Daddee's Shelf — Admin Features & Cart Rules
-- 20260807000001_admin_features_and_cart_rules.sql
-- ============================================================

-- ── 1. Admin Online Sessions ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
  tiktok_handle TEXT NOT NULL DEFAULT '',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON public.admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_last_seen ON public.admin_sessions(last_seen_at);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_admin_sessions" ON public.admin_sessions;
CREATE POLICY "anon_all_admin_sessions"
  ON public.admin_sessions FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_all_admin_sessions" ON public.admin_sessions;
CREATE POLICY "public_all_admin_sessions"
  ON public.admin_sessions FOR ALL TO public USING (true) WITH CHECK (true);

-- ── 2. Admin Chat Messages ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_handle TEXT NOT NULL DEFAULT '',
  sender_display_name TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON public.admin_messages(created_at);

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_admin_messages" ON public.admin_messages;
CREATE POLICY "anon_all_admin_messages"
  ON public.admin_messages FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_all_admin_messages" ON public.admin_messages;
CREATE POLICY "public_all_admin_messages"
  ON public.admin_messages FOR ALL TO public USING (true) WITH CHECK (true);

-- ── 3. Announcements / Banners ────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_starts_at ON public.announcements(starts_at);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_announcements" ON public.announcements;
CREATE POLICY "public_read_announcements"
  ON public.announcements FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "anon_all_announcements" ON public.announcements;
CREATE POLICY "anon_all_announcements"
  ON public.announcements FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── 4. Waitlist table (for sold-out cart items) ───────────
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tiktok_handle TEXT NOT NULL DEFAULT '',
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  book_sku TEXT NOT NULL DEFAULT '',
  book_title TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_waitlist_tiktok ON public.waitlist(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_waitlist_book_id ON public.waitlist(book_id);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_waitlist" ON public.waitlist;
CREATE POLICY "anon_all_waitlist"
  ON public.waitlist FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_all_waitlist" ON public.waitlist;
CREATE POLICY "public_all_waitlist"
  ON public.waitlist FOR ALL TO public USING (true) WITH CHECK (true);
