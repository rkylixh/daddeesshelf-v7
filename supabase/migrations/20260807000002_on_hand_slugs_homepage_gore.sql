-- Migration: on_hand_items, customer_slugs, homepage_settings, gore_level on books

-- 1. Add gore_level to books (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'books' AND column_name = 'gore_level'
  ) THEN
    ALTER TABLE public.books ADD COLUMN gore_level integer DEFAULT 0;
  END IF;
END $$;

-- 2. on_hand_items table
CREATE TABLE IF NOT EXISTS public.on_hand_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  author text NOT NULL DEFAULT '',
  genre text NOT NULL DEFAULT '',
  subgenre text NOT NULL DEFAULT '',
  series text NOT NULL DEFAULT '',
  series_order integer,
  format text NOT NULL DEFAULT 'Paperback',
  edition text NOT NULL DEFAULT '',
  final_srp numeric NOT NULL DEFAULT 0,
  inventory integer NOT NULL DEFAULT 0,
  synopsis text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  goodreads_url text NOT NULL DEFAULT '',
  goodreads_score numeric,
  spice_level numeric DEFAULT 0,
  gore_level integer DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  is_price_visible boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- RLS for on_hand_items
ALTER TABLE public.on_hand_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'on_hand_items' AND policyname = 'on_hand_items_public_read'
  ) THEN
    CREATE POLICY on_hand_items_public_read ON public.on_hand_items
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'on_hand_items' AND policyname = 'on_hand_items_anon_write'
  ) THEN
    CREATE POLICY on_hand_items_anon_write ON public.on_hand_items
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. customer_slugs table
CREATE TABLE IF NOT EXISTS public.customer_slugs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tiktok_handle text NOT NULL UNIQUE,
  user_slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- RLS for customer_slugs
ALTER TABLE public.customer_slugs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_slugs' AND policyname = 'customer_slugs_public_read'
  ) THEN
    CREATE POLICY customer_slugs_public_read ON public.customer_slugs
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_slugs' AND policyname = 'customer_slugs_anon_write'
  ) THEN
    CREATE POLICY customer_slugs_anon_write ON public.customer_slugs
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 4. homepage_settings table
CREATE TABLE IF NOT EXISTS public.homepage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- RLS for homepage_settings
ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'homepage_settings' AND policyname = 'homepage_settings_public_read'
  ) THEN
    CREATE POLICY homepage_settings_public_read ON public.homepage_settings
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'homepage_settings' AND policyname = 'homepage_settings_anon_write'
  ) THEN
    CREATE POLICY homepage_settings_anon_write ON public.homepage_settings
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed default homepage settings
INSERT INTO public.homepage_settings (key, value) VALUES
  ('hero', '{"eyebrow": "❧ Discovering Your Next Favorite Story ❧", "tagline": "Your curated bookshop for pre-orders and on-hand titles."}'::jsonb),
  ('how_it_works', '[{"step":"1","icon":"BookOpenIcon","title":"Browse & Select","desc":"Choose titles from the current import batch"},{"step":"2","icon":"ShoppingCartIcon","title":"Add to Cart","desc":"Add multiple books to your preorder cart"},{"step":"3","icon":"QrCodeIcon","title":"Pay via GCash","desc":"Scan the QR code and send payment"},{"step":"4","icon":"CheckCircleIcon","title":"Track Your Order","desc":"Use your PIN to check status anytime"}]'::jsonb),
  ('section_visibility', '{"best_sellers":true,"current_batch":true,"booktok_favorites":true,"featured_books":true,"fresh_picks":true,"how_it_works":true,"faqs":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
