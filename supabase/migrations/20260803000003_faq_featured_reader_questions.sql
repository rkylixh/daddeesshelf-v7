-- Daddee's Shelf — FAQ Featured & Reader Questions Enhancement
-- Adds: is_featured column to faqs, ensures RLS policies for public read

-- ============================================================
-- 1. ADD is_featured TO faqs TABLE
-- ============================================================
ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 2. ENSURE RLS POLICIES FOR faqs (public read)
-- ============================================================
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faqs_select_visible" ON public.faqs;
CREATE POLICY "faqs_select_visible"
  ON public.faqs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "faqs_insert_auth" ON public.faqs;
CREATE POLICY "faqs_insert_auth"
  ON public.faqs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "faqs_update_auth" ON public.faqs;
CREATE POLICY "faqs_update_auth"
  ON public.faqs FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "faqs_delete_auth" ON public.faqs;
CREATE POLICY "faqs_delete_auth"
  ON public.faqs FOR DELETE
  USING (true);

-- ============================================================
-- 3. ENSURE RLS POLICIES FOR reader_comments
-- ============================================================
ALTER TABLE public.reader_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reader_comments_select_published" ON public.reader_comments;
CREATE POLICY "reader_comments_select_published"
  ON public.reader_comments FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "reader_comments_insert_public" ON public.reader_comments;
CREATE POLICY "reader_comments_insert_public"
  ON public.reader_comments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "reader_comments_update_auth" ON public.reader_comments;
CREATE POLICY "reader_comments_update_auth"
  ON public.reader_comments FOR UPDATE
  USING (true);
