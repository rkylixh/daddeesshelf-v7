-- ============================================================
-- Daddee's Shelf — Master Appendix Schema Migration
-- 20260804000002_master_appendix_schema.sql
-- Additive only — no data deletion, no table recreation
-- ============================================================

-- ── 1. Books table: add missing columns from Master Appendix ──
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS goodreads_link TEXT DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS spice_rating INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'Available'::text;

-- Backfill visibility from is_visible
UPDATE public.books
  SET visibility = CASE
    WHEN is_visible = false THEN 'Hidden'
    WHEN inventory - reserved <= 0 AND (arrival_date IS NULL OR arrival_date <= CURRENT_DATE) THEN 'Sold Out'
    WHEN arrival_date IS NOT NULL AND arrival_date > CURRENT_DATE THEN 'Coming Soon'
    ELSE 'Available'
  END
  WHERE visibility IS NULL OR visibility = '';

-- ── 2. Support tickets table (contact form messages) ──
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  tiktok_handle TEXT DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'New',
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON public.support_tickets(created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_support_tickets" ON public.support_tickets;
CREATE POLICY "anon_insert_support_tickets"
  ON public.support_tickets FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_support_tickets" ON public.support_tickets;
CREATE POLICY "anon_read_support_tickets"
  ON public.support_tickets FOR SELECT TO anon USING (false);

-- ── 3. Ensure booktok_favorites exists (may already exist from prev migration) ──
CREATE TABLE IF NOT EXISTS public.booktok_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  added_by TEXT DEFAULT ''::text,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_booktok_favorites_book_id ON public.booktok_favorites(book_id);
CREATE INDEX IF NOT EXISTS idx_booktok_favorites_sort ON public.booktok_favorites(sort_order);

ALTER TABLE public.booktok_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_booktok_favorites" ON public.booktok_favorites;
CREATE POLICY "public_read_booktok_favorites"
  ON public.booktok_favorites FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "anon_read_booktok_favorites" ON public.booktok_favorites;
CREATE POLICY "anon_read_booktok_favorites"
  ON public.booktok_favorites FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── 4. Ensure best_sellers_seed exists ──
CREATE TABLE IF NOT EXISTS public.best_sellers_seed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_best_sellers_seed_book_id ON public.best_sellers_seed(book_id);

ALTER TABLE public.best_sellers_seed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_best_sellers_seed" ON public.best_sellers_seed;
CREATE POLICY "public_read_best_sellers_seed"
  ON public.best_sellers_seed FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "anon_read_best_sellers_seed" ON public.best_sellers_seed;
CREATE POLICY "anon_read_best_sellers_seed"
  ON public.best_sellers_seed FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── 5. Ensure audit_logs has all required columns ──
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS module TEXT DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS prev_value TEXT DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS new_value TEXT DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS target_record TEXT DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS explanation TEXT DEFAULT ''::text;

-- ── 6. Ensure reader_comments has preferred_name ──
ALTER TABLE public.reader_comments
  ADD COLUMN IF NOT EXISTS preferred_name TEXT DEFAULT ''::text;

-- ── 7. Inventory automation functions (idempotent) ──

CREATE OR REPLACE FUNCTION public.decrement_inventory_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  item JSONB;
  book_sku TEXT;
  qty INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      book_sku := item->>'sku';
      qty := COALESCE((item->>'qty')::INTEGER, 1);
      UPDATE public.books
        SET reserved = LEAST(reserved + qty, inventory),
            updated_at = CURRENT_TIMESTAMP
        WHERE sku = book_sku
          AND (inventory - reserved) >= qty;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$func$;

CREATE OR REPLACE FUNCTION public.restore_inventory_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  item JSONB;
  book_sku TEXT;
  qty INTEGER;
  old_status TEXT;
  new_status TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_status := OLD.status::TEXT;
    new_status := NEW.status::TEXT;
    IF new_status IN ('Cancelled', 'Abandoned')
       AND old_status NOT IN ('Cancelled', 'Abandoned') THEN
      FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
      LOOP
        book_sku := item->>'sku';
        qty := COALESCE((item->>'qty')::INTEGER, 1);
        UPDATE public.books
          SET reserved = GREATEST(reserved - qty, 0),
              updated_at = CURRENT_TIMESTAMP
          WHERE sku = book_sku;
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_decrement_inventory ON public.orders;
CREATE TRIGGER trg_decrement_inventory
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_inventory_on_order();

DROP TRIGGER IF EXISTS trg_restore_inventory ON public.orders;
CREATE TRIGGER trg_restore_inventory
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_inventory_on_cancel();

-- ── 8. Seed best sellers if table is empty ──
DO $$
DECLARE
  active_batch TEXT;
  book_rec RECORD;
  seed_order INTEGER := 0;
  seed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO seed_count FROM public.best_sellers_seed;
  IF seed_count > 0 THEN
    RETURN;
  END IF;

  SELECT batch INTO active_batch
  FROM public.books
  WHERE is_visible = true
    AND arrival_date IS NOT NULL
    AND arrival_date > CURRENT_DATE
  ORDER BY arrival_date ASC
  LIMIT 1;

  IF active_batch IS NULL THEN
    SELECT batch INTO active_batch
    FROM public.books
    WHERE is_visible = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF active_batch IS NOT NULL THEN
    FOR book_rec IN
      SELECT id FROM public.books
      WHERE batch = active_batch
        AND is_visible = true
      ORDER BY goodreads_score DESC NULLS LAST, title ASC
      LIMIT 9
    LOOP
      INSERT INTO public.best_sellers_seed (book_id, sort_order)
      VALUES (book_rec.id, seed_order)
      ON CONFLICT DO NOTHING;
      seed_order := seed_order + 1;
    END LOOP;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Best sellers seed skipped: %', SQLERRM;
END $$;
