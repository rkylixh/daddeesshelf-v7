-- Daddee's Shelf — Complete Schema Migration
-- Tables: books, bundles, faqs, title_requests, orders, wishlists, admin_profiles

-- ============================================================
-- 1. TYPES
-- ============================================================
DROP TYPE IF EXISTS public.book_status CASCADE;
CREATE TYPE public.book_status AS ENUM ('Pre-order', 'On Hand', 'Sold Out');

DROP TYPE IF EXISTS public.book_format CASCADE;
CREATE TYPE public.book_format AS ENUM ('Paperback', 'Hardcover', 'Special Edition', 'Omnibus', 'Bundle');

DROP TYPE IF EXISTS public.order_status CASCADE;
CREATE TYPE public.order_status AS ENUM ('Pending', 'Fully Paid', 'Refunded', 'Packed', 'Waiting for Courier', 'Shipped', 'Replaced', 'Abandoned', 'Cancelled', 'Buyers Remorse');

DROP TYPE IF EXISTS public.tracking_status CASCADE;
CREATE TYPE public.tracking_status AS ENUM ('Preparing', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed', 'Returned', 'Damaged', 'Lost');

DROP TYPE IF EXISTS public.request_status CASCADE;
CREATE TYPE public.request_status AS ENUM ('Pending', 'Noted', 'Added to Batch', 'Declined');

-- ============================================================
-- 2. CORE TABLES
-- ============================================================

-- Books table (single source of truth for inventory)
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT NOT NULL DEFAULT '',
  subgenre TEXT NOT NULL DEFAULT '',
  series TEXT NOT NULL DEFAULT '',
  series_order INTEGER,
  format TEXT NOT NULL DEFAULT 'Paperback',
  edition TEXT NOT NULL DEFAULT '',
  final_srp NUMERIC(10,2) NOT NULL DEFAULT 0,
  batch TEXT NOT NULL DEFAULT '',
  arrival_date DATE,
  inventory INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  synopsis TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  goodreads_url TEXT NOT NULL DEFAULT '',
  goodreads_score NUMERIC(3,2),
  spice_level INTEGER DEFAULT 0,
  popular_quotes TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bundles table
CREATE TABLE IF NOT EXISTS public.bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  final_srp NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bundle books junction
CREATE TABLE IF NOT EXISTS public.bundle_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0
);

-- FAQs table
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Title requests from customers
CREATE TABLE IF NOT EXISTS public.title_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  tiktok_handle TEXT NOT NULL,
  requested_title TEXT NOT NULL,
  requested_author TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status public.request_status DEFAULT 'Pending'::public.request_status,
  admin_notes TEXT NOT NULL DEFAULT '',
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  is_test BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Customer orders (preorders)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  tiktok_handle TEXT NOT NULL,
  customer_pin TEXT,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT '',
  payment_ref TEXT NOT NULL DEFAULT '',
  payment_screenshot_url TEXT NOT NULL DEFAULT '',
  status public.order_status DEFAULT 'Pending'::public.order_status,
  tracking_status public.tracking_status DEFAULT 'Preparing'::public.tracking_status,
  waybill_number TEXT NOT NULL DEFAULT '',
  order_issues TEXT NOT NULL DEFAULT '',
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  is_test BOOLEAN NOT NULL DEFAULT false,
  is_pile_shipping BOOLEAN NOT NULL DEFAULT false,
  refund_type TEXT,
  refund_amount NUMERIC(10,2),
  refund_ref TEXT NOT NULL DEFAULT '',
  refund_at TIMESTAMPTZ,
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Wishlists (out-of-stock interest)
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  tiktok_handle TEXT NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  book_sku TEXT NOT NULL DEFAULT '',
  book_title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending',
  admin_notes TEXT NOT NULL DEFAULT '',
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Admin profiles (for admin authentication)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tiktok_handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  customer_pin TEXT NOT NULL,
  is_owner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_handle TEXT NOT NULL,
  action TEXT NOT NULL,
  target_ref TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Reader comments (FAQ page)
CREATE TABLE IF NOT EXISTS public.reader_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  tiktok_handle TEXT NOT NULL,
  comment TEXT NOT NULL,
  admin_reply TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_books_sku ON public.books(sku);
CREATE INDEX IF NOT EXISTS idx_books_genre ON public.books(genre);
CREATE INDEX IF NOT EXISTS idx_books_batch ON public.books(batch);
CREATE INDEX IF NOT EXISTS idx_books_arrival_date ON public.books(arrival_date);
CREATE INDEX IF NOT EXISTS idx_books_is_visible ON public.books(is_visible);
CREATE INDEX IF NOT EXISTS idx_orders_tiktok_handle ON public.orders(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_title_requests_status ON public.title_requests(status);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);

-- ============================================================
-- 4. FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
SELECT EXISTS (
  SELECT 1 FROM auth.users au
  WHERE au.id = auth.uid()
  AND (au.raw_user_meta_data->>'role' = 'admin'
       OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

-- ============================================================
-- 5. ENABLE RLS
-- ============================================================
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reader_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- Books: public read, admin write
DROP POLICY IF EXISTS "books_public_read" ON public.books;
CREATE POLICY "books_public_read" ON public.books FOR SELECT TO public USING (is_visible = true);

DROP POLICY IF EXISTS "books_admin_all" ON public.books;
CREATE POLICY "books_admin_all" ON public.books FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- Bundles: public read, admin write
DROP POLICY IF EXISTS "bundles_public_read" ON public.bundles;
CREATE POLICY "bundles_public_read" ON public.bundles FOR SELECT TO public USING (is_visible = true);

DROP POLICY IF EXISTS "bundles_admin_all" ON public.bundles;
CREATE POLICY "bundles_admin_all" ON public.bundles FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- Bundle books: public read, admin write
DROP POLICY IF EXISTS "bundle_books_public_read" ON public.bundle_books;
CREATE POLICY "bundle_books_public_read" ON public.bundle_books FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "bundle_books_admin_all" ON public.bundle_books;
CREATE POLICY "bundle_books_admin_all" ON public.bundle_books FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- FAQs: public read, admin write
DROP POLICY IF EXISTS "faqs_public_read" ON public.faqs;
CREATE POLICY "faqs_public_read" ON public.faqs FOR SELECT TO public USING (is_visible = true);

DROP POLICY IF EXISTS "faqs_admin_all" ON public.faqs;
CREATE POLICY "faqs_admin_all" ON public.faqs FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- Title requests: public insert, admin all
DROP POLICY IF EXISTS "title_requests_public_insert" ON public.title_requests;
CREATE POLICY "title_requests_public_insert" ON public.title_requests FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "title_requests_admin_all" ON public.title_requests;
CREATE POLICY "title_requests_admin_all" ON public.title_requests FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- Orders: public insert, admin all
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
CREATE POLICY "orders_public_insert" ON public.orders FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all" ON public.orders FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- Wishlists: public insert, admin all
DROP POLICY IF EXISTS "wishlists_public_insert" ON public.wishlists;
CREATE POLICY "wishlists_public_insert" ON public.wishlists FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "wishlists_admin_all" ON public.wishlists;
CREATE POLICY "wishlists_admin_all" ON public.wishlists FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- Admin profiles: admin only
DROP POLICY IF EXISTS "admin_profiles_admin_all" ON public.admin_profiles;
CREATE POLICY "admin_profiles_admin_all" ON public.admin_profiles FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- Audit logs: admin only
DROP POLICY IF EXISTS "audit_logs_admin_all" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_all" ON public.audit_logs FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- Reader comments: public insert + read published, admin all
DROP POLICY IF EXISTS "reader_comments_public_read" ON public.reader_comments;
CREATE POLICY "reader_comments_public_read" ON public.reader_comments FOR SELECT TO public USING (is_published = true);

DROP POLICY IF EXISTS "reader_comments_public_insert" ON public.reader_comments;
CREATE POLICY "reader_comments_public_insert" ON public.reader_comments FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "reader_comments_admin_all" ON public.reader_comments;
CREATE POLICY "reader_comments_admin_all" ON public.reader_comments FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- ============================================================
-- 7. TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS books_updated_at ON public.books;
CREATE TRIGGER books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS bundles_updated_at ON public.bundles;
CREATE TRIGGER bundles_updated_at BEFORE UPDATE ON public.bundles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS faqs_updated_at ON public.faqs;
CREATE TRIGGER faqs_updated_at BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS title_requests_updated_at ON public.title_requests;
CREATE TRIGGER title_requests_updated_at BEFORE UPDATE ON public.title_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 8. SEED DATA — 161 BOOKS FROM INVENTORY SPREADSHEET
-- ============================================================
DO $$
BEGIN

-- BATCH 1 — September 4, 2026
INSERT INTO public.books (sku, title, author, genre, subgenre, series, series_order, format, edition, final_srp, batch, arrival_date, inventory, reserved) VALUES
('MGR-001', '1Q84', 'Haruki Murakami', 'Literary Fiction', 'Magical Realism', '', NULL, 'Paperback', 'Vintage International', 1690, 'Batch 1', '2026-09-04', 1, 0),
('CRT-001', 'After That Night', 'Karin Slaughter', 'Thriller', 'Crime Thriller', 'Will Trent', 11, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('LIH-001', 'All the Light We Cannot See', 'Anthony Doerr', 'Historical Fiction', 'Literary Historical', '', NULL, 'Paperback', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('COR-001', 'Alone With You in the Ether', 'Olivie Blake', 'Romance', 'Contemporary Romance', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('DYS-001', 'Brave New World', 'Aldous Huxley', 'Science Fiction', 'Dystopian', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('SET-001', 'The Cat and Mouse Duet', 'H. D. Carlton', 'Romance', 'Dark Romance', 'The Cat and Mouse Duet', NULL, 'Paperback', 'Books 1-2 Bundle', 3290, 'Batch 1', '2026-09-04', 1, 0),
('LTF-001', 'Counterattacks at Thirty', 'Won-pyung Sohn', 'Literary Fiction', 'Contemporary Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('EPF-001', 'Dark Heir', 'C.S. Pacat', 'Fantasy', 'Epic Fantasy', 'Dark Rise', 2, 'Paperback', '', 990, 'Batch 1', '2026-09-04', 3, 1),
('EPF-002', 'Dark Rise', 'C.S. Pacat', 'Fantasy', 'Epic Fantasy', 'Dark Rise', 1, 'Paperback', '', 990, 'Batch 1', '2026-09-04', 2, 1),
('SUF-001', 'Extraordinaries', 'TJ Klune', 'Fantasy', 'Superhero Fantasy', 'The Extraordinaries', 1, 'Paperback', '', 1090, 'Batch 1', '2026-09-04', 1, 0),
('PSH-001', 'Galloway''s Gospel', 'Sam Rebelein', 'Horror', 'Psychological Horror', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('LTF-002', 'Girl Dinner', 'Olivie Blake', 'Literary Fiction', 'Short Story Collection', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('SET-002', 'Legacy of Gods', 'Rina Kent', 'Romance', 'Dark Romance', 'Legacy of Gods', NULL, 'Paperback', 'Books 1-6 Bundle', 6500, 'Batch 1', '2026-09-04', 1, 0),
('PST-001', 'Good Bad Girl', 'Alice Feeney', 'Thriller', 'Psychological Thriller', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('MST-001', 'Has Anyone Seen Charlotte Salter?', 'Nicci French', 'Thriller', 'Mystery Thriller', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('DAR-001', 'Haunting Adeline', 'H. D. Carlton', 'Romance', 'Dark Romance', 'Cat and Mouse Duet', 1, 'Paperback', '', 1390, 'Batch 1', '2026-09-04', 1, 0),
('SCF-001', 'Heavenly Tyrant', 'Xiran Jay Zhao', 'Fantasy', 'Science Fantasy', 'Iron Widow', 2, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('DAF-001', 'House of the Beast', 'Michelle Wong', 'Fantasy', 'Dark Fantasy', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('COR-002', 'Love and Other Words', 'Christina Lauren', 'Romance', 'Contemporary Romance', '', NULL, 'Hardcover', 'Deluxe Edition', 690, 'Batch 1', '2026-09-04', 2, 0),
('SNH-001', 'My Darling Girl', 'Jennifer McMahon', 'Horror', 'Supernatural Horror', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('DYS-002', 'Nineteen Eighty-Four', 'George Orwell', 'Classics', 'Dystopian', '', NULL, 'Paperback', 'SF Masterworks', 690, 'Batch 1', '2026-09-04', 1, 0),
('SET-003', 'The Ruinous Love Trilogy', 'Brynne Weaver', 'Romance', 'Dark Romance', 'The Ruinous Love Trilogy', NULL, 'Paperback', 'Books 1-3 Bundle', 3500, 'Batch 1', '2026-09-04', 1, 0),
('COF-001', 'Sorcery of Small Magic', 'Maiga Doocy', 'Fantasy', 'Cozy Fantasy', '', NULL, 'Paperback', '', 1490, 'Batch 1', '2026-09-04', 1, 0),
('EPF-003', 'Sword of Kaigen', 'M.L. Wang', 'Fantasy', 'Epic Fantasy', '', NULL, 'Paperback', '', 1690, 'Batch 1', '2026-09-04', 1, 0),
('RMT-001', 'The Half King', 'Melissa Landers', 'Fantasy', 'Romantasy', 'The Half King Series', 1, 'Hardcover', 'Deluxe Limited Edition', 690, 'Batch 1', '2026-09-04', 1, 0),
('DYS-003', 'The Handmaid''s Tale', 'Margaret Atwood', 'Classics', 'Dystopian', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('MLR-001', 'The Last Letter', 'Rebecca Yarros', 'Romance', 'Military Romance', '', NULL, 'Paperback', '', 990, 'Batch 1', '2026-09-04', 6, 0),
('MLR-002', 'The Last Letter Signed', 'Rebecca Yarros', 'Romance', 'Military Romance', '', NULL, 'Hardcover', 'Signed Edition', 3690, 'Batch 1', '2026-09-04', 1, 0),
('CZM-001', 'The Maid''s Secret', 'Nita Prose', 'Mystery', 'Cozy Mystery', 'Molly the Maid', 3, 'Paperback', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('CZM-002', 'The Maid''s Secret Indigo', 'Nita Prose', 'Mystery', 'Cozy Mystery', 'Molly the Maid', 3, 'Paperback', 'Indigo Edition', 690, 'Batch 1', '2026-09-04', 1, 0),
('SCF-002', 'The Martian Chronicles', 'Ray Bradbury', 'Science Fiction', 'Science Fantasy', '', NULL, 'Hardcover', 'Deluxe Collector''s Edition', 690, 'Batch 1', '2026-09-04', 1, 0),
('SNH-002', 'The Mist', 'Stephen King', 'Horror', 'Supernatural Horror', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('COR-003', 'The Rom-Commers', 'Ashley Poston', 'Romance', 'Contemporary Romance', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('URF-001', 'The Society of Unknowable Objects', 'Gareth Brown', 'Fantasy', 'Urban Fantasy', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('HMF-001', 'The Women of Wild Hill', 'Kirsten Miller', 'Historical Fiction', 'Historical Mystery', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('GTH-001', '200 Monas', 'Kirsten Bakis', 'Horror', 'Gothic Horror', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('RMT-002', 'A Forgery of Fate', 'Aya de Leon', 'Fantasy', 'Romantasy', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('LTF-003', 'A Man Called Ove', 'Fredrik Backman', 'Literary Fiction', 'Contemporary Fiction', '', NULL, 'Paperback', 'Otto Movie Tie-In', 690, 'Batch 1', '2026-09-04', 1, 0),
('RMT-003', 'A River of Golden Bones', 'A.K. Mulford', 'Fantasy', 'Romantasy', 'The Golden Court', 1, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('HIF-001', 'A Spartan''s Sorrow', 'Hannah Lynn', 'Historical Fiction', 'Historical Fantasy', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('CRT-002', 'All the Sinners Bleed', 'S. A. Cosby', 'Thriller', 'Crime Thriller', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('YAR-001', 'Betting on You', 'Lynn Painter', 'Romance', 'Young Adult Romance', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('EPF-004', 'Blackthorn', 'Melanie Cellier', 'Fantasy', 'Epic Fantasy', '', NULL, 'Paperback', 'Walmart Edition', 1390, 'Batch 1', '2026-09-04', 1, 0),
('RMT-004', 'Children of Fallen Gods', 'Carissa Broadbent', 'Fantasy', 'Romantasy', 'The War of Lost Hearts', 2, 'Paperback', '', 1690, 'Batch 1', '2026-09-04', 1, 0),
('PST-002', 'Darker Days', 'Katherine Arden', 'Thriller', 'Psychological Thriller', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('LTF-004', 'Death of the Author', 'Nnedi Okorafor', 'Literary Fiction', 'Speculative Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('LTF-005', 'Extremely Loud and Incredibly Close', 'Jonathan Safran Foer', 'Literary Fiction', 'Contemporary Fiction', '', NULL, 'Paperback', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('SNH-003', 'Firestarter', 'Stephen King', 'Horror', 'Supernatural Horror', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('COR-004', 'Friends With Benefits', 'Marisa Kanter', 'Romance', 'Contemporary Romance', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('MYT-001', 'Greek Mythology', 'Liv Albert', 'Mythology', 'Greek Mythology', '', NULL, 'Paperback', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('RMT-005', 'He Who Drowned the World', 'Shelley Parker-Chan', 'Fantasy', 'Romantasy', 'The Radiant Emperor Duology', 2, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('YAF-001', 'Icon and Inferno', 'Marie Lu', 'Fantasy', 'Young Adult Fantasy', 'Stars and Smoke', 2, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('DAC-001', 'If We Were Villains', 'M. L. Rio', 'Mystery', 'Dark Academia', '', NULL, 'Paperback', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('RMT-006', 'Immortal', 'Sue Lynn Tan', 'Fantasy', 'Romantasy', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('MST-002', 'Just Another Missing Person', 'Gillian McAllister', 'Thriller', 'Mystery Thriller', '', NULL, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('CZM-003', 'Marble Hall Murders', 'Anthony Horowitz', 'Mystery', 'Cozy Mystery', 'Susan Ryeland', 3, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('DAR-002', 'No Rest for the Wicked', 'Kresley Cole', 'Romance', 'Dark Romance', 'Immortals After Dark', 2, 'Paperback', '', 990, 'Batch 1', '2026-09-04', 1, 0),
('CLF-001', 'Noli Me Tangere', 'Jose Rizal', 'Classics', 'Classic Literature', '', NULL, 'Paperback', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('RMT-007', 'Phantasma', 'Kaylie Smith', 'Fantasy', 'Romantasy', 'Wicked Games', 1, 'Hardcover', '', 690, 'Batch 1', '2026-09-04', 1, 0),
('HOR-001', 'Skeleton Crew: Stories', 'Stephen King', 'Horror', 'Horror Short Stories', '', NULL, 'Paperback', '', 690, 'Batch 1', '2026-09-04', 1, 0)
ON CONFLICT (sku) DO NOTHING;

-- BATCH 2 — September 20, 2026
INSERT INTO public.books (sku, title, author, genre, subgenre, series, series_order, format, edition, final_srp, batch, arrival_date, inventory, reserved) VALUES
('YAF-002', 'Stars and Smoke', 'Marie Lu', 'Fantasy', 'Young Adult Fantasy', 'Stars and Smoke', 1, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('COR-005', 'Summer in the City', 'Alex Aster', 'Romance', 'Contemporary Romance', '', NULL, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('WCF-001', 'The Burnout', 'Sophie Kinsella', 'Fiction', 'Women''s Contemporary Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('MGR-002', 'The Cat Who Saved the Library', 'Sosuke Natsukawa', 'Fantasy', 'Magical Realism', '', NULL, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('MYF-001', 'The Children of Jocasta', 'Natalie Haynes', 'Fiction', 'Mythological Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('COR-006', 'The Cuffing Game', 'Lyla Lee', 'Romance', 'Contemporary Romance', '', NULL, 'Hardcover', 'Target Edition', 690, 'Batch 2', '2026-09-20', 1, 0),
('NFC-001', 'The Elements', 'Euclid; Theodore Gray', 'Nonfiction', 'Mathematics', '', NULL, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('SNH-004', 'The Haunting of Room 904', 'Erika T. Wurth', 'Horror', 'Supernatural Horror', '', NULL, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('MST-003', 'The Invitation', 'Lucy Foley', 'Thriller', 'Mystery Thriller', '', NULL, 'Paperback', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('LIF-001', 'The Land of Sweet Forever', 'Harper Lee', 'Fiction', 'Literary Fiction', '', NULL, 'Hardcover', 'Books-A-Million Edition', 690, 'Batch 2', '2026-09-20', 1, 0),
('SET-004', 'The Lightlark Saga PB', 'Alex Aster', 'Fantasy', 'Romantasy', 'The Lightlark Saga', NULL, 'Paperback', 'Ultimate Box Set', 2390, 'Batch 2', '2026-09-20', 1, 0),
('LTF-006', 'The Little Liar', 'Mitch Albom', 'Literary Fiction', 'Historical Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 2, 0),
('PST-003', 'The Midnight Feast', 'Lucy Foley', 'Thriller', 'Psychological Thriller', '', NULL, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 2, 0),
('CZM-004', 'The Mystery Guest', 'Nita Prose', 'Mystery', 'Cozy Mystery', 'Molly the Maid', 2, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('YAT-001', 'The Naturals', 'Jennifer Lynn Barnes', 'Thriller', 'Young Adult Thriller', 'The Naturals', 1, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('PST-004', 'The Perfect Marriage', 'Jeneva Rose', 'Thriller', 'Psychological Thriller', '', NULL, 'Paperback', '', 690, 'Batch 2', '2026-09-20', 2, 0),
('LIH-002', 'The Red Tent', 'Anita Diamant', 'Historical Fiction', 'Literary Historical', '', NULL, 'Hardcover', '20th Anniversary Edition', 690, 'Batch 2', '2026-09-20', 1, 0),
('YAM-001', 'The Same Backward as Forward B2', 'Jennifer Lynn Barnes', 'Mystery', 'Young Adult Mystery', 'The Inheritance Games', 5, 'Hardcover', 'Deluxe Limited Edition', 690, 'Batch 2', '2026-09-20', 1, 0),
('COR-007', 'The Things We Leave Unfinished', 'Rebecca Yarros', 'Romance', 'Contemporary Romance', '', NULL, 'Paperback', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('LTF-007', 'The Trunk', 'Kim Ryeo-ling', 'Literary Fiction', 'Contemporary Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('CLF-002', 'The War of the Worlds', 'H.G. Wells', 'Classics', 'Science Fiction', '', NULL, 'Paperback', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('DAF-002', 'The Wolf and the Woodsman', 'Ava Reid', 'Fantasy', 'Dark Fantasy', '', NULL, 'Hardcover', 'Deluxe Collector''s Edition', 690, 'Batch 2', '2026-09-20', 1, 0),
('HIF-006', 'The Women', 'Kristin Hannah', 'Historical Fiction', 'Historical Fiction', '', NULL, 'Hardcover', '', 990, 'Batch 2', '2026-09-20', 1, 0),
('LTF-008', 'Together We Will Go', 'J. Michael Straczynski', 'Fiction', 'Contemporary Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 1, 0),
('ROM-002', 'Twice', 'Mitch Albom', 'Fiction', 'Contemporary Fiction', '', NULL, 'Hardcover', 'Target Edition', 690, 'Batch 2', '2026-09-20', 2, 0),
('DAF-003', 'Vilest Things', 'Chloe Gong', 'Fantasy', 'Dark Fantasy', 'Flesh & False Gods', 2, 'Hardcover', '', 690, 'Batch 2', '2026-09-20', 1, 0)
ON CONFLICT (sku) DO NOTHING;

-- BATCH 3 — September 29, 2026
INSERT INTO public.books (sku, title, author, genre, subgenre, series, series_order, format, edition, final_srp, batch, arrival_date, inventory, reserved) VALUES
('RMT-008', 'A Curse of Shadows and Ice', 'L.J. Andrews', 'Fantasy', 'Romantasy', 'Shadowbound', 1, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('YAF-003', 'A Thousand Steps Into Night', 'Traci Chee', 'Fantasy', 'Young Adult Fantasy', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('HOR-002', 'Aftertaste', 'Daria Polatin', 'Horror', 'Psychological Horror', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('THR-001', 'Assassins Anonymous', 'Rob Hart', 'Thriller', 'Action Thriller', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('CLF-003', 'Beowulf', 'Unknown; Seamus Heaney', 'Classics', 'Epic Poetry', '', NULL, 'Hardcover', 'Signature Editions', 690, 'Batch 3', '2026-09-29', 1, 0),
('BUS-001', 'Best Offer Wins: A Novel', 'Marisa Kashino', 'Business', 'Sales', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('YAR-002', 'Better Than the Movies', 'Lynn Painter', 'Romance', 'Young Adult Romance', '', NULL, 'Paperback', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('EPF-009', 'Blood & Fury', 'Tessa Gratton; Justina Ireland', 'Fantasy', 'Epic Fantasy', 'Chaos & Flame', 2, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('EPF-010', 'Break Wide the Sea', 'Emma Torzs', 'Fantasy', 'Epic Fantasy', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('MST-004', 'Daughter of Mine', 'Megan Miranda', 'Thriller', 'Mystery Thriller', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('CLF-004', 'Dracula', 'Bram Stoker', 'Classics', 'Gothic Fiction', '', NULL, 'Hardcover', 'Signature Gilded Editions', 690, 'Batch 3', '2026-09-29', 1, 0),
('THR-002', 'Drowning', 'T.J. Newman', 'Thriller', 'Disaster Thriller', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('HIF-002', 'Enemy of My Dreams', 'Jenny Williamson', 'Historical Fiction', 'Historical Romance', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('REL-001', 'ESV Holy Bible', 'Various; Crossway', 'Religion', 'Christianity', '', NULL, 'Hardcover', 'Black, The Church Edition', 790, 'Batch 3', '2026-09-29', 1, 1),
('DAF-004', 'Fallen Gods', 'Rachel Van Dyken', 'Fantasy', 'Dark Fantasy', '', NULL, 'Hardcover', 'Deluxe Limited Edition', 690, 'Batch 3', '2026-09-29', 1, 0),
('EPF-011', 'Fate of the Fallen', 'Kel Kade', 'Fantasy', 'Epic Fantasy', 'Shroud of Prophecy', 1, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('RMT-009', 'Fearless', 'Lauren Roberts', 'Fantasy', 'Romantasy', 'The Powerless Trilogy', 3, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('RMT-010', 'Fourth Wing', 'Rebecca Yarros', 'Fantasy', 'Romantasy', 'The Empyrean', 1, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('SCI-001', 'Game On', 'Navessa Allen', 'Science Fiction', 'Science Fiction Romance', '', NULL, 'Paperback', '', 1290, 'Batch 3', '2026-09-29', 2, 1),
('SCI-002', 'Godfall', 'Van Jensen', 'Science Fiction', 'Space Opera', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('ROM-006', 'Gravity', 'K.L. Clare', 'Romance', 'Contemporary Romance', 'Wilde Boys', 1, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('DAF-006', 'Hunting Adeline', 'H. D. Carlton', 'Romance', 'Dark Romance', 'Cat and Mouse Duet', 2, 'Paperback', '', 1790, 'Batch 3', '2026-09-29', 1, 0),
('YAF-004', 'Immortal YA', 'Sue Lynn Tan', 'Fantasy', 'Young Adult Fantasy', '', NULL, 'Hardcover', 'Deluxe Limited Edition', 690, 'Batch 3', '2026-09-29', 3, 0),
('GTF-001', 'Immortality: A Love Story', 'Dana Schwartz', 'Fantasy', 'Gothic Fantasy', 'The Anatomy Duology', 2, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('LTF-009', 'In the Family Way', 'Laney K. Becker', 'Fiction', 'Historical Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('LTF-010', 'Intemperance', 'Sonora Jha', 'Fiction', 'Literary Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('RMT-011', 'Iron Flame', 'Rebecca Yarros', 'Fantasy', 'Romantasy', 'The Empyrean', 2, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('HOR-005', 'It', 'Stephen King', 'Horror', 'Horror', '', NULL, 'Paperback', '', 690, 'Batch 3', '2026-09-29', 5, 0),
('ANT-001', 'Januaries', 'Olivie Blake', 'Fantasy', 'Anthology', '', NULL, 'Paperback', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('ROM-008', 'Lady''s Knight', 'Amie Kaufman; Meagan Spooner', 'Fantasy', 'Romantic Fantasy', '', NULL, 'Hardcover', '', 1290, 'Batch 3', '2026-09-29', 1, 0),
('HIF-003', 'Masquerade', 'O.O. Sangoyomi', 'Historical Fiction', 'Historical Fantasy', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('HOR-003', 'Misery', 'Stephen King', 'Horror', 'Psychological Horror', '', NULL, 'Paperback', '', 690, 'Batch 3', '2026-09-29', 1, 1),
('RMT-012', 'Never the Roses', 'Jennifer K. Lambert', 'Fantasy', 'Romantasy', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 2, 0),
('DAC-002', 'Nocticadia', 'Keri Lake', 'Fantasy', 'Dark Academia', '', NULL, 'Hardcover', 'Deluxe Edition', 1490, 'Batch 3', '2026-09-29', 1, 0),
('MYF-002', 'North Is the Night', 'Emily Rath', 'Fantasy', 'Mythological Fantasy', 'The Tuonela Duet', 1, 'Hardcover', 'Deluxe Edition', 690, 'Batch 3', '2026-09-29', 1, 0),
('DAF-008', 'One Dark Window', 'Rachel Gillig', 'Fantasy', 'Dark Fantasy', 'The Shepherd King', 1, 'Hardcover', 'Deluxe Limited Hardcover Edition', 1590, 'Batch 3', '2026-09-29', 1, 0),
('RMT-013', 'Onyx Storm', 'Rebecca Yarros', 'Fantasy', 'Romantasy', 'The Empyrean', 3, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('PST-005', 'Party of Liars', 'Jeneva Rose', 'Thriller', 'Psychological Thriller', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('RMT-014', 'Powerless', 'Lauren Roberts', 'Fantasy', 'Romantasy', 'The Powerless Trilogy', 1, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('YAH-001', 'Rules for Vanishing', 'Kate Alice Marshall', 'Horror', 'Young Adult Horror', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('MST-005', 'Silent Sister', 'Megan Davidhizar', 'Thriller', 'Mystery Thriller', '', NULL, 'Paperback', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('EPF-005', 'Sisters of Sword and Song', 'Rebecca Ross', 'Fantasy', 'Epic Fantasy', '', NULL, 'Paperback', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('EPF-006', 'Son of the Morning', 'Akwaeke Emezi', 'Fantasy', 'Epic Fantasy', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('YAF-005', 'Spellbound', 'Georgia Leighton', 'Fantasy', 'Young Adult Fantasy', '', NULL, 'Hardcover', '', 790, 'Batch 3', '2026-09-29', 1, 0),
('RMT-015', 'Sweet Nightmare', 'Tracy Wolff', 'Fantasy', 'Romantasy', 'The Calder Academy', 1, 'Hardcover', 'Deluxe Limited Edition', 690, 'Batch 3', '2026-09-29', 1, 0),
('LTF-011', 'The Blueprint', 'Rae Giana Rashad', 'Fiction', 'Contemporary Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('SET-005', 'The Captive Prince Trilogy', 'C.S. Pacat', 'Fantasy', 'Fantasy', 'Captive Prince', NULL, 'Paperback', 'Box Set', 4090, 'Batch 3', '2026-09-29', 2, 1),
('EPF-007', 'The Executioners Three', 'Stephen R. Lawhead', 'Fantasy', 'Epic Fantasy', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('LTF-012', 'The Faculty Lounge', 'Jennifer Mathieu', 'Fiction', 'Contemporary Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('HIF-004', 'The Glassmaker', 'Tracy Chevalier', 'Historical Fiction', 'Historical Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('LIF-002', 'The Land of Sweet Forever B3', 'Harper Lee', 'Fiction', 'Literary Fiction', '', NULL, 'Hardcover', 'Books-A-Million Edition', 690, 'Batch 3', '2026-09-29', 1, 0),
('MST-006', 'The Last Murder at the End of the World', 'Stuart Turton', 'Thriller', 'Mystery Thriller', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('EPF-008', 'The Last Tiger', 'Julia Riew', 'Fantasy', 'Epic Fantasy', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('LTF-013', 'The Leaving Room', 'Amber McBride', 'Fiction', 'Literary Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('GTF-002', 'The Lies of Alma Blackwell', 'Amanda Glaze', 'Fantasy', 'Gothic Fantasy', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('SET-006', 'The Lightlark Saga HB', 'Alex Aster', 'Fantasy', 'Romantasy', 'The Lightlark Saga', NULL, 'Hardcover', 'Ultimate Box Set', 2490, 'Batch 3', '2026-09-29', 1, 0),
('LTF-014', 'The Lost Ticket', 'Freya Sampson', 'Fiction', 'Contemporary Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('LTF-015', 'The Mighty Red', 'Louise Erdrich', 'Fiction', 'Literary Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('HOR-004', 'The Mist PB', 'Stephen King', 'Horror', 'Supernatural Horror', '', NULL, 'Paperback', '', 790, 'Batch 3', '2026-09-29', 1, 0),
('RMT-016', 'The Nightblood Prince', 'Molly X. Chang', 'Fantasy', 'Romantasy', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('YAF-006', 'The Notorious Virtues', 'Alwyn Hamilton', 'Fantasy', 'Young Adult Fantasy', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('YAM-002', 'The Same Backward as Forward B3', 'Jennifer Lynn Barnes', 'Mystery', 'Young Adult Mystery', 'The Inheritance Games', 5, 'Hardcover', 'Deluxe Limited Edition', 690, 'Batch 3', '2026-09-29', 1, 0),
('CLF-005', 'The Strange Case of Dr. Jekyll and Mr. Hyde', 'Robert Louis Stevenson', 'Classics', 'Gothic Fiction', '', NULL, 'Hardcover', 'Signature Gilded Edition', 690, 'Batch 3', '2026-09-29', 1, 0),
('COR-008', 'The Summer of You and Me', 'Sue Moorcroft', 'Romance', 'Contemporary Romance', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('CLF-006', 'To Kill a Mockingbird', 'Harper Lee', 'Classics', 'Literary Fiction', '', NULL, 'Hardcover', 'Collector''s Edition', 690, 'Batch 3', '2026-09-29', 1, 0),
('DAF-009', 'Two Twisted Crowns', 'Rachel Gillig', 'Fantasy', 'Dark Fantasy', 'The Shepherd King', 2, 'Hardcover', 'Deluxe Limited Hardcover Edition', 1690, 'Batch 3', '2026-09-29', 1, 0),
('HIF-005', 'Under the Same Stars', 'Libba Bray', 'Historical Fiction', 'Historical Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('RMT-017', 'We Free the Stars', 'Hafsah Faizal', 'Fantasy', 'Romantasy', 'Sands of Arawiya', 2, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('SCI-003', 'When the Moon Hits Your Eye', 'John Scalzi', 'Science Fiction', 'Humorous Science Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 1, 0),
('LTF-016', 'Yellowface', 'R. F. Kuang', 'Fiction', 'Literary Fiction', '', NULL, 'Hardcover', '', 690, 'Batch 3', '2026-09-29', 2, 0)
ON CONFLICT (sku) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Book seed error: %', SQLERRM;
END $$;

-- ============================================================
-- 9. SEED FAQ DATA
-- ============================================================
DO $$
BEGIN

INSERT INTO public.faqs (category, question, answer, sort_order) VALUES
-- About Our Books
('About Our Books', 'What kinds of books do you sell?', 'Highly-curated imported titles focused on BookTok sensations, trending romance (including various spice levels), gripping thrillers, fantasy blockbusters, classics, and historical fiction. Both brand-new pre-orders and carefully selected preloved titles are offered.', 1),
('About Our Books', 'Are your books authentic?', 'Yes — every book is a 100% original, authentic edition sourced directly from reputable international publishers and trusted global distributors. There is a zero-tolerance policy for counterfeit reprints.', 2),
('About Our Books', 'What is a remaindered copy?', 'Remaindered books are brand-new, unread overstock copies returned to the publisher. Publishers place a small mark (dot or line) on the bottom edge. They are completely unread and in excellent condition, offered at beautiful discounts.', 3),
('About Our Books', 'Why are your books more affordable?', 'By importing directly in bulk batches and securing publisher overstocks (remaindered copies), middle-distributor markups are bypassed and the savings are passed on to customers.', 4),
('About Our Books', 'Can books have minor cosmetic imperfections?', 'Since books travel from international publishers to Manila, some copies (especially remaindered titles) may show very minor shelf wear, light corner dings, or tiny scratches. Every copy is inspected and guaranteed fully readable and beautiful.', 5),
('About Our Books', 'How often do you restock?', 'Fresh import pre-order batches and restocks of popular sold-out titles are launched regularly. Customers can click ''Join Next Batch'' on any sold-out title or use the ''Request a Title'' page.', 6),
-- Ordering & Eligibility
('Ordering & Eligibility', 'Do you accept Cash on Delivery (COD)?', 'No. All imported book orders require completed payment and verification before final shipment.', 1),
('Ordering & Eligibility', 'Who can place a pre-order?', 'Pre-orders are exclusively available to TikTok followers of @daddees.shelf.', 2),
('Ordering & Eligibility', 'Can I cancel or change my order?', 'No. A strict no-cancellation and no-replacement policy is enforced once a reservation is locked in.', 3),
('Ordering & Eligibility', 'Do pre-orders require full payment immediately?', 'Yes — 100% full payment upfront is required to secure your reservation slot directly with global publishers.', 4),
('Ordering & Eligibility', 'Are downpayments or layaway plans available for pre-orders?', 'Downpayment options and flexible layaway plans are reserved exclusively for on-hand books claimed during TikTok Live sessions. All imported pre-order titles must be settled in full.', 5),
-- Payment & Reservation
('Payment & Reservation', 'What are your Modes of Payment (MOP)?', 'GCash and Bank Transfers. Personalized actual QR codes are displayed directly during the checkout process.', 1),
('Payment & Reservation', 'How do I confirm my payment?', 'Upload a clear screenshot of your receipt and input the transaction reference code directly into the pre-order form.', 2),
('Payment & Reservation', 'What is the payment deadline for pre-orders?', 'Pre-orders must be settled in full upon form submission. For on-hand TikTok Live claims, invoices must be settled within 24 hours of receipt.', 3),
('Payment & Reservation', 'What happens if I miss the 24-hour deadline?', 'The invoice is automatically cancelled and the book is returned to stock. For pre-orders, your slot is not secured or reserved until payment details are successfully submitted.', 4),
-- Importation
('Importation', 'Are these books on hand?', 'No. They are incoming pre-order titles being imported. Estimated Times of Arrival (ETAs) are announced with each batch drop.', 1),
('Importation', 'How will I know when my books have arrived?', 'A direct notification is sent as soon as the imported shipment arrives in the Manila office. Customers can then choose to have them shipped immediately or piled with other orders.', 2),
('Importation', 'Can I request a restock of sold-out titles?', 'Yes — via the ''Request a Title'' form or by clicking ''Join Next Batch'' on any sold-out title detail page. Requests are monitored daily to guide upcoming import shipments.', 3),
-- Shipping & Fulfillment
('Shipping & Fulfillment', 'When will my order be packed?', 'Books are packaged securely with premium bubble wrap and sturdy protection immediately after arrival and quality inspection. Since pre-orders are fully paid upfront, customers can choose to ship immediately or consolidate with other orders.', 1),
('Shipping & Fulfillment', 'What are your Modes of Delivery (MOD)?', 'Lalamove (Metro Manila), Grab, or J&T Express (for nationwide delivery). All shipping fees are shouldered by the customer upon delivery.', 2),
('Shipping & Fulfillment', 'Where are you located?', 'Located in and shipping directly from Manila, Philippines.', 3),
('Shipping & Fulfillment', 'Can I combine multiple pre-orders to save on shipping?', 'Yes — check ''Pile/Bundle Shipping'' during checkout. Books are held and consolidated to ship together as a single parcel once all requested pre-order titles have arrived.', 4),
-- TikTok Live Layaway
('TikTok Live Layaway', 'What is the required downpayment?', 'A 50% deposit is required within 24 hours of invoice receipt. This plan is strictly for on-hand books claimed live; pre-orders require full payment.', 1),
('TikTok Live Layaway', 'What are your Modes of Payment (MOP) for layaway?', 'GCash or Bank Transfers for both the initial downpayment and the remaining final balance.', 2),
('TikTok Live Layaway', 'How do I officially activate my layaway plan?', 'Send a clear screenshot of your downpayment transaction via TikTok messages.', 3),
('TikTok Live Layaway', 'When will my books be shipped?', 'All layaway books are packed and shipped immediately once the remaining balance has been fully settled and verified.', 4),
('TikTok Live Layaway', 'Can I modify or change my order once it is active?', 'No adjustments, modifications, or book swaps are permitted once the layaway plan has officially started.', 5),
('TikTok Live Layaway', 'What happens if I miss the 15-day payment deadline?', 'Failure to settle the outstanding balance within 15 days results in forfeiture of the initial 50% downpayment.', 6),
('TikTok Live Layaway', 'Why do we use this system?', 'It uses a classic layaway structure — simple, fair, and affordable. There are no credit checks or hidden fees.', 7),
-- Important Notices
('Important Notices', 'Can I get my books before I finish paying?', 'No — books are only packed and shipped after the entire remaining balance is paid and verified in full.', 1),
('Important Notices', 'Is this a financing or credit plan?', 'No. The layaway service is not a financing or credit plan. No items can be released while there is an outstanding balance.', 2)
ON CONFLICT DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'FAQ seed error: %', SQLERRM;
END $$;
