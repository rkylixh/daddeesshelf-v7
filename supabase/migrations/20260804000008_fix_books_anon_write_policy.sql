-- ============================================================
-- Fix: Allow anon role to write books (admin panel uses PIN auth, not Supabase Auth)
-- 20260804000008_fix_books_anon_write_policy.sql
-- ============================================================

-- The admin panel authenticates via PIN stored in admin_users table (not Supabase Auth).
-- All admin operations run as the 'anon' role. We need to allow anon to INSERT/UPDATE/DELETE books.

-- Drop existing write policy (only allowed authenticated)
DROP POLICY IF EXISTS "books_admin_all" ON public.books;

-- Allow anon to read ALL books (admin needs to see hidden books too)
DROP POLICY IF EXISTS "books_admin_read_all" ON public.books;
CREATE POLICY "books_admin_read_all"
  ON public.books FOR SELECT
  TO anon
  USING (true);

-- Allow anon to insert books
DROP POLICY IF EXISTS "books_anon_insert" ON public.books;
CREATE POLICY "books_anon_insert"
  ON public.books FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon to update books
DROP POLICY IF EXISTS "books_anon_update" ON public.books;
CREATE POLICY "books_anon_update"
  ON public.books FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anon to delete books
DROP POLICY IF EXISTS "books_anon_delete" ON public.books;
CREATE POLICY "books_anon_delete"
  ON public.books FOR DELETE
  TO anon
  USING (true);

-- Re-create the authenticated admin policy (keep for future Supabase Auth usage)
DROP POLICY IF EXISTS "books_admin_all" ON public.books;
CREATE POLICY "books_admin_all"
  ON public.books FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
