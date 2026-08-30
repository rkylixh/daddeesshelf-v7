-- ============================================================
-- Add `ordered` column to books table
-- Tracks how many units of a title have been ordered by customers.
-- The `reserved` column remains admin-only and is no longer
-- touched by customer order triggers.
-- ============================================================

-- 1. Add `ordered` column
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS ordered INTEGER NOT NULL DEFAULT 0;

-- 2. Replace decrement trigger: increment `ordered` (not `reserved`) on order insert
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
        SET ordered = ordered + qty,
            updated_at = CURRENT_TIMESTAMP
        WHERE sku = book_sku;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$func$;

-- 3. Replace restore trigger: decrement `ordered` (not `reserved`) on cancel/abandon
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
          SET ordered = GREATEST(ordered - qty, 0),
              updated_at = CURRENT_TIMESTAMP
          WHERE sku = book_sku;
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$func$;

-- 4. Re-create triggers (they already exist but functions are updated above)
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
