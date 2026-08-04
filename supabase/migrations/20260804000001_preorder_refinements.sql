-- ============================================================
-- Daddee's Shelf — Preorder Refinements Migration
-- 20260804000001_preorder_refinements.sql
-- ============================================================

-- ── 1. Add preferred_name to reader_comments (FAQ submissions) ──
ALTER TABLE public.reader_comments
  ADD COLUMN IF NOT EXISTS preferred_name TEXT DEFAULT ''::text;

-- ── 2. Enhance audit_logs with module, prev/new value columns ──
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS module TEXT DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS prev_value TEXT DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS new_value TEXT DEFAULT ''::text;

-- ── 3. BookTok Favorites table ──
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

-- ── 4. Best Sellers seed table ──
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

-- ── 5. Inventory automation: decrement on preorder, restore on cancel/abandon ──

-- Function: decrement inventory when order is created
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
  -- Only process new orders (INSERT)
  IF TG_OP = 'INSERT' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      book_sku := item->>'sku';
      qty := COALESCE((item->>'qty')::INTEGER, 1);
      -- Decrement inventory, never below 0
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

-- Function: restore inventory when order is cancelled or abandoned
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
    -- Only restore when transitioning TO cancelled/abandoned
    IF new_status IN ('Cancelled', 'Abandoned')
       AND old_status NOT IN ('Cancelled', 'Abandoned') THEN
      FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
      LOOP
        book_sku := item->>'sku';
        qty := COALESCE((item->>'qty')::INTEGER, 1);
        -- Restore reserved quantity, never below 0
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

-- Triggers for inventory automation
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

-- ── 6. Seed Best Sellers from current active batch (top BookTok titles) ──
DO $$
DECLARE
  active_batch TEXT;
  book_rec RECORD;
  seed_order INTEGER := 0;
BEGIN
  -- Find current active batch (earliest future arrival_date)
  SELECT batch INTO active_batch
  FROM public.books
  WHERE is_visible = true
    AND arrival_date IS NOT NULL
    AND arrival_date > CURRENT_DATE
  ORDER BY arrival_date ASC
  LIMIT 1;

  IF active_batch IS NULL THEN
    -- Fallback: use most recent batch
    SELECT batch INTO active_batch
    FROM public.books
    WHERE is_visible = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF active_batch IS NOT NULL THEN
    -- Clear existing seed data
    DELETE FROM public.best_sellers_seed;

    -- Seed with top books from active batch ordered by goodreads_score
    FOR book_rec IN
      SELECT id FROM public.books
      WHERE batch = active_batch
        AND is_visible = true
      ORDER BY goodreads_score DESC NULLS LAST, title ASC
      LIMIT 8
    LOOP
      INSERT INTO public.best_sellers_seed (book_id, sort_order)
      VALUES (book_rec.id, seed_order)
      ON CONFLICT (id) DO NOTHING;
      seed_order := seed_order + 1;
    END LOOP;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Best sellers seed failed: %', SQLERRM;
END $$;
