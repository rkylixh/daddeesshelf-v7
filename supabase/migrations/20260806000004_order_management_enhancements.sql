-- ============================================================
-- Daddee's Shelf — Order Management Enhancements v2
-- 20260806000004_order_management_enhancements.sql
-- Additive only — no data deletion, no table recreation
-- ============================================================

-- ── 1. Add is_preorder flag to orders ──────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Add refund_at column to orders (if not exists) ──────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_at TIMESTAMPTZ DEFAULT NULL;

-- ── 3. Add is_active (activation toggle) to store_credits ──
ALTER TABLE public.store_credits
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- ── 4. Add notes field to audit_logs ───────────────────────
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';

-- ── 5. Add explanation field to audit_logs (if not exists) ─
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS explanation TEXT NOT NULL DEFAULT '';

-- ── 6. Backfill existing store credits: Active status = is_active true ──
UPDATE public.store_credits
  SET is_active = true
  WHERE status = 'Active' AND is_active = false;
