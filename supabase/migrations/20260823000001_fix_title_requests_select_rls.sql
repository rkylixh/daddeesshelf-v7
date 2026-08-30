-- ============================================================
-- Daddee's Shelf — Fix Title Requests SELECT RLS for Anon Users
-- 20260823000001_fix_title_requests_select_rls.sql
--
-- Root cause: The title_requests table has no SELECT policy for
-- anon (unauthenticated) users. The admin panel uses PIN-based
-- auth (stored in sessionStorage), NOT Supabase Auth, so it
-- queries as the anon role. RLS silently returns 0 rows on
-- SELECT even though INSERT succeeds (public insert policy exists).
-- This migration adds a SELECT policy for anon so the admin
-- requests page can read submitted title requests.
-- ============================================================

-- Allow anon users to SELECT title_requests (needed for Admin Requests page)
DROP POLICY IF EXISTS "title_requests_anon_select" ON public.title_requests;
CREATE POLICY "title_requests_anon_select"
ON public.title_requests FOR SELECT
  TO anon
  USING (true);

-- Also ensure authenticated users can SELECT (belt-and-suspenders)
DROP POLICY IF EXISTS "title_requests_authenticated_select" ON public.title_requests;
CREATE POLICY "title_requests_authenticated_select"
ON public.title_requests FOR SELECT
  TO authenticated
  USING (true);
