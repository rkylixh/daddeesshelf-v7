-- Add is_price_visible and is_eta_visible columns to books table
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS is_price_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_eta_visible boolean NOT NULL DEFAULT true;

-- Set initial state: prices hidden for Batch 2 and Batch 3
UPDATE public.books
SET is_price_visible = false
WHERE batch IN ('Batch 2', 'Batch 3');
