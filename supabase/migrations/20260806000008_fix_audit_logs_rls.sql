-- Fix audit_logs RLS: allow anon inserts and reads (admin panel uses anon key without Supabase Auth)
-- The admin panel authenticates via custom PIN session stored in sessionStorage,
-- not via Supabase Auth, so auth.uid() is always null for admin actions.
-- The AdminGuard component enforces access control at the application level.

-- Drop the existing catch-all policy that blocks anon inserts
DROP POLICY IF EXISTS "audit_logs_admin_all" ON public.audit_logs;

-- Allow anon role to INSERT audit logs (admin panel uses anon key)
DROP POLICY IF EXISTS "audit_logs_anon_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_anon_insert" ON public.audit_logs
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anon role to SELECT audit logs (admin panel uses anon key; AdminGuard enforces app-level auth)
DROP POLICY IF EXISTS "audit_logs_anon_select" ON public.audit_logs;
CREATE POLICY "audit_logs_anon_select" ON public.audit_logs
  FOR SELECT TO anon
  USING (true);

-- Keep authenticated admin access as well (for future Supabase Auth integration)
DROP POLICY IF EXISTS "audit_logs_admin_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_from_auth());

DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin_from_auth());

DROP POLICY IF EXISTS "audit_logs_admin_update" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_update" ON public.audit_logs
  FOR UPDATE TO authenticated
  USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

DROP POLICY IF EXISTS "audit_logs_admin_delete" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_delete" ON public.audit_logs
  FOR DELETE TO authenticated
  USING (public.is_admin_from_auth());
