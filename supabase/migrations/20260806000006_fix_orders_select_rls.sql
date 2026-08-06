-- ============================================================
-- Daddee's Shelf — Fix Orders SELECT RLS for Anon Users
-- 20260806000006_fix_orders_select_rls.sql
--
-- Root cause: The orders table has no SELECT policy for anon
-- (unauthenticated) users. RLS silently returns 0 rows when
-- a customer queries their own orders in My Orders, even
-- though the INSERT succeeds. This migration adds a SELECT
-- policy so customers can read orders by tiktok_handle.
-- ============================================================

-- Allow anon users to SELECT orders (needed for My Orders page)
DROP POLICY IF EXISTS "orders_anon_select" ON public.orders;
CREATE POLICY "orders_anon_select"
  ON public.orders FOR SELECT
  TO anon
  USING (true);

-- Also ensure authenticated users can SELECT (belt-and-suspenders)
DROP POLICY IF EXISTS "orders_authenticated_select" ON public.orders;
CREATE POLICY "orders_authenticated_select"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);
