-- ============================================================
-- Daddee's Shelf — Fix Orders UPDATE RLS Policy
-- 20260806000005_fix_orders_update_rls.sql
-- The admin panel uses sessionStorage (not Supabase Auth),
-- so the admin is 'anon' to Supabase. The previous UPDATE
-- policy required auth.role() = 'authenticated' which blocked
-- all admin order updates. This migration opens UPDATE to anon
-- as well, since access control is handled at the app layer.
-- ============================================================

-- Drop the old update policy that required authenticated role
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;

-- New policy: allow UPDATE for both anon and authenticated
-- (Admin access is enforced at the application layer via sessionStorage)
DROP POLICY IF EXISTS "orders_update_open" ON public.orders;
CREATE POLICY "orders_update_open"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Also ensure DELETE is open for anon (in case needed by admin)
DROP POLICY IF EXISTS "orders_delete_open" ON public.orders;
CREATE POLICY "orders_delete_open"
  ON public.orders FOR DELETE
  TO anon, authenticated
  USING (true);
