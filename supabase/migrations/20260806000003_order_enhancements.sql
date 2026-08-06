-- ============================================================
-- Daddee's Shelf — Order Management Enhancements
-- 20260806000003_order_enhancements.sql
-- Additive only — no data deletion, no table recreation
-- ============================================================

-- ── 1. Add tracking_link, processing_status, order_notes to orders ──
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_link TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'Preparing',
  ADD COLUMN IF NOT EXISTS order_notes TEXT NOT NULL DEFAULT '';

-- ── 2. Add owner_notes to title_requests ──
ALTER TABLE public.title_requests
  ADD COLUMN IF NOT EXISTS owner_notes TEXT NOT NULL DEFAULT '';
