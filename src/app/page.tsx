'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StarField from '@/components/layout/StarField';
import HomeHero from './components/HomeHero';
import BookGrid from '@/components/books/BookGrid';
import BookCard from '@/components/books/BookCard';
import { getBooks } from '@/lib/books';
import { Book } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface BatchInfo {
  name: string;
  eta: string | null;
  count: number;
}

interface SiteStats {
  titlesAvailable: number;
  activeBatchCount: number;
  lowestPrice: number;
  wishlistCount: number;
}

// ── Section divider that feels like a bookstore aisle ──
function BookstoreDivider({ label }: { label: string }) {
  return (
    <div
      className="relative text-center content-wrapper"
      style={{ margin: '3.5rem auto', padding: '0 1.5rem' }}
    >
      <div
        className="absolute top-1/2 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(200,164,91,0.2), rgba(200,164,91,0.5), rgba(200,164,91,0.2), transparent)',
          transform: 'translateY(-50%)',
        }}
      />
      <span
        className="relative inline-block px-5 text-xs font-semibold uppercase tracking-widest font-sans"
        style={{
          background: 'transparent',
          color: 'var(--primary-bright)',
          letterSpacing: '0.22em',
        }}
      >
        <span
          style={{
            background: 'linear-gradient(180deg, #F9F1E3, #F4E8D2)',
            padding: '0 1rem',
            display: 'inline-block',
          }}
        >
          {label}
        </span>
      </span>
    </div>
  );
}

// ── Section wrapper that feels like a cozy bookstore corner ──
function BookstoreSection({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className={`content-wrapper py-12 mb-4 ${className}`}
      style={{
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </section>
  );
}

// ── Best Sellers Carousel ──────────────────────────────────
function BestSellersCarousel({ books }: { books: Book[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const visibleCount = 3;
  const total = books.length;

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (paused || total === 0) return;
    intervalRef.current = setInterval(next, 3500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, next, total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  if (total === 0) return null;

  const indices = Array.from({ length: Math.min(visibleCount, total) }, (_, i) => (current + i) % total);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={prev}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full items-center justify-center -translate-x-4 hidden sm:flex"
        style={{ background: 'rgba(247,239,225,0.9)', border: '1px solid rgba(200,164,91,0.4)', color: 'var(--primary-bright)', boxShadow: '0 2px 8px rgba(75,53,42,0.12)' }}
        aria-label="Previous"
      >
        <Icon name="ChevronLeftIcon" size={18} />
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-hidden">
        {indices.map((idx, pos) => {
          const book = books[idx];
          return (
            <Link key={`bs-${book.id}-${pos}`} href={`/book-detail?id=${book.id}`} className="group block">
              <div
                className="rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-[1.02]"
                style={{
                  background: 'rgba(251,245,236,0.22)',
                  border: '1px solid rgba(200,164,91,0.35)',
                  boxShadow: '0 4px 20px rgba(75,53,42,0.12), 0 1px 4px rgba(75,53,42,0.08)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                }}
              >
                <div className="relative aspect-[2/3]">
                  <AppImage
                    src={book.cover_url || '/assets/images/no_image.png'}
                    alt={`Cover of ${book.title} by ${book.author}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {book.status === 'Pre-order' && (
                    <div className="absolute top-2 left-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,164,91,0.92)', color: '#3A2214' }}>
                        Preorder
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--foreground)' }}>{book.title}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--foreground-muted)' }}>{book.author}</p>
                  <p className="text-xs font-bold mt-1" style={{ color: 'var(--primary-bright)' }}>₱{book.final_srp.toLocaleString()}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <button
        onClick={next}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full items-center justify-center translate-x-4 hidden sm:flex"
        style={{ background: 'rgba(247,239,225,0.9)', border: '1px solid rgba(200,164,91,0.4)', color: 'var(--primary-bright)', boxShadow: '0 2px 8px rgba(75,53,42,0.12)' }}
        aria-label="Next"
      >
        <Icon name="ChevronRightIcon" size={18} />
      </button>

      <div className="flex justify-center gap-1.5 mt-4">
        {books.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-1.5 rounded-full transition-all"
            style={{
              background: i === current ? 'var(--primary-bright)' : 'rgba(200,164,91,0.3)',
              width: i === current ? '20px' : '6px',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [batchBooks, setBatchBooks] = useState<Book[]>([]);
  const [bestSellers, setBestSellers] = useState<Book[]>([]);
  const [booktokFavorites, setBooktokFavorites] = useState<Book[]>([]);
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [booksRes, wishlistRes] = await Promise.all([
          supabase.from('books').select('final_srp, batch, is_visible').eq('is_visible', true),
          supabase.from('wishlists').select('id', { count: 'exact', head: true }),
        ]);

        const allBooks = booksRes.data ?? [];
        const distinctBatches = [...new Set(allBooks.map((b: Record<string, unknown>) => String(b.batch)).filter(Boolean))];
        const prices = allBooks.map((b: Record<string, unknown>) => Number(b.final_srp)).filter(p => p > 0);

        setSiteStats({
          titlesAvailable: allBooks.length,
          activeBatchCount: distinctBatches.length,
          lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
          wishlistCount: wishlistRes.count ?? 0,
        });

        const { data: batchRows } = await supabase
          .from('books')
          .select('batch, arrival_date')
          .eq('is_visible', true)
          .not('arrival_date', 'is', null)
          .order('arrival_date', { ascending: true });

        if (!batchRows || batchRows.length === 0) { setLoading(false); return; }

        const now = new Date();
        const futureBatches = batchRows.filter((r: Record<string, unknown>) => r.arrival_date && new Date(String(r.arrival_date)) > now);

        let activeBatchName: string | null = null;
        let activeBatchEta: string | null = null;

        if (futureBatches.length > 0) {
          activeBatchName = String(futureBatches[0].batch);
          activeBatchEta = String(futureBatches[0].arrival_date);
        } else {
          activeBatchName = String(batchRows[batchRows.length - 1].batch);
          activeBatchEta = String(batchRows[batchRows.length - 1].arrival_date);
        }

        if (!activeBatchName) { setLoading(false); return; }

        const books = await getBooks({ batch: activeBatchName });
        const preorderBooks = books.filter(b => b.status === 'Pre-order');

        setBatchInfo({ name: activeBatchName, eta: activeBatchEta, count: preorderBooks.length });
        setBatchBooks(preorderBooks.slice(0, 6));

        const { data: seedData } = await supabase
          .from('best_sellers_seed')
          .select('book_id, sort_order')
          .order('sort_order', { ascending: true })
          .limit(9);

        if (seedData && seedData.length > 0) {
          const seedIds = seedData.map((s: Record<string, unknown>) => String(s.book_id));
          const { data: seedBooks } = await supabase
            .from('books')
            .select('*')
            .in('id', seedIds)
            .eq('is_visible', true);
          if (seedBooks && seedBooks.length > 0) {
            const ordered = seedIds
              .map(id => seedBooks.find((b: Record<string, unknown>) => b.id === id))
              .filter(Boolean) as Record<string, unknown>[];
            setBestSellers(ordered.map(mapBookRow));
          }
        } else {
          const topBooks = [...preorderBooks]
            .sort((a, b) => (b.goodreads_score ?? 0) - (a.goodreads_score ?? 0))
            .slice(0, 9);
          setBestSellers(topBooks);
        }

        const { data: btFavs } = await supabase
          .from('booktok_favorites')
          .select('book_id, sort_order')
          .order('sort_order', { ascending: true })
          .limit(6);

        if (btFavs && btFavs.length > 0) {
          const favIds = btFavs.map((f: Record<string, unknown>) => String(f.book_id));
          const { data: favBooks } = await supabase
            .from('books')
            .select('*')
            .in('id', favIds)
            .eq('is_visible', true);
          if (favBooks && favBooks.length > 0) {
            const ordered = favIds
              .map(id => favBooks.find((b: Record<string, unknown>) => b.id === id))
              .filter(Boolean) as Record<string, unknown>[];
            setBooktokFavorites(ordered.map(mapBookRow));
          }
        }

      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatEta = (dateStr: string | null) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* StarField background — same as all other pages */}
      <StarField />

      {/* Page content sits above the environment */}
      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar />
        <main className="pt-16">
          {/* ── 1. Hero — the bookstore entrance ── */}
          <HomeHero stats={siteStats} />

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
            </div>
          ) : (
            <>
              {/* ── 2. Best Sellers — the front table ── */}
              {bestSellers.length > 0 && (
                <>
                  <BookstoreDivider label="✦ Best Sellers ✦" />
                  <BookstoreSection>
                    {/* Warm reading nook glow behind this section */}
                    <div
                      className="absolute inset-0 pointer-events-none rounded-2xl"
                      style={{
                        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,220,140,0.08) 0%, transparent 70%)',
                      }}
                      aria-hidden="true"
                    />
                    <div className="flex items-end justify-between mb-6 relative">
                      <div>
                        <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Best Sellers</h2>
                        <p className="text-sm mt-1 font-serif italic" style={{ color: 'var(--foreground-muted)' }}>
                          Top BookTok titles — curated from the strongest picks
                        </p>
                      </div>
                      <Link href="/preorder-list" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--primary-bright)' }}>
                        View all →
                      </Link>
                    </div>
                    <BestSellersCarousel books={bestSellers} />
                  </BookstoreSection>
                </>
              )}

              {/* ── 3. Current Import Batch — the new arrivals shelf ── */}
              {batchInfo && (
                <>
                  <BookstoreDivider label="✦ Current Import Batch ✦" />
                  <BookstoreSection>
                    {/* Parchment card for batch info */}
                    <div
                      className="rounded-2xl p-6 mb-8 relative overflow-hidden"
                      style={{
                        background: 'rgba(251,245,236,0.22)',
                        border: '1px solid rgba(200,164,91,0.35)',
                        boxShadow: '0 4px 24px rgba(75,53,42,0.10), inset 0 1px 0 rgba(255,255,255,0.4)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                      }}
                    >
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--primary)', letterSpacing: '0.15em' }}>
                            ✦ Now Open for Preorder
                          </p>
                          <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                            {batchInfo.name}
                          </h2>
                          <div className="flex flex-wrap items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                              <Icon name="CalendarIcon" size={14} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
                              <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                ETA: <strong style={{ color: 'var(--foreground)' }}>{formatEta(batchInfo.eta)}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Icon name="BookOpenIcon" size={14} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
                              <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                <strong style={{ color: 'var(--foreground)' }}>{batchInfo.count}</strong> titles available
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link href="/preorder-list" className="btn-primary text-sm px-6 py-2.5 flex-shrink-0">
                          Preorder Now ✦
                        </Link>
                      </div>
                    </div>

                    {batchBooks.length > 0 && (
                      <>
                        <div className="flex items-end justify-between mb-6">
                          <div>
                            <h3 className="font-display text-xl font-bold" style={{ color: 'var(--foreground)' }}>Titles in This Batch</h3>
                            <p className="text-sm mt-1 font-serif italic" style={{ color: 'var(--foreground-muted)' }}>Reserve your copy before the batch closes</p>
                          </div>
                          <Link href="/preorder-list" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--primary-bright)' }}>
                            View all →
                          </Link>
                        </div>
                        <BalancedBookGrid books={batchBooks} />
                      </>
                    )}
                  </BookstoreSection>
                </>
              )}

              {/* ── 4. BookTok Favorites — the curated display shelf ── */}
              {booktokFavorites.length > 0 && (
                <>
                  <BookstoreDivider label="✦ BookTok Favorites ✦" />
                  <BookstoreSection>
                    <div className="flex items-end justify-between mb-6">
                      <div>
                        <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>BookTok Favorites</h2>
                        <p className="text-sm mt-1 font-serif italic" style={{ color: 'var(--foreground-muted)' }}>
                          Curated by Daddee&apos;s Shelf — titles loved by the BookTok community
                        </p>
                      </div>
                      <Link href="/shop" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--primary-bright)' }}>
                        View all →
                      </Link>
                    </div>
                    <BookGrid books={booktokFavorites} />
                  </BookstoreSection>
                </>
              )}

              {/* ── 5. How Preordering Works — the notice board ── */}
              <BookstoreDivider label="✦ How It Works ✦" />
              <BookstoreSection>
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>How Preordering Works</h2>
                  <p className="text-sm max-w-md mx-auto font-serif italic" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
                    Simple, secure, and hassle-free
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                  {[
                    { step: '1', icon: 'BookOpenIcon', title: 'Browse & Select', desc: 'Choose titles from the current import batch' },
                    { step: '2', icon: 'ShoppingCartIcon', title: 'Add to Cart', desc: 'Add multiple books to your preorder cart' },
                    { step: '3', icon: 'QrCodeIcon', title: 'Pay via GCash', desc: 'Scan the QR code and send payment' },
                    { step: '4', icon: 'CheckCircleIcon', title: 'Track Your Order', desc: 'Use your PIN to check status anytime' },
                  ].map(item => (
                    <div
                      key={item.step}
                      className="rounded-xl p-5 text-center"
                      style={{
                        background: 'rgba(251,245,236,0.22)',
                        border: '1px solid rgba(200,164,91,0.45)',
                        boxShadow: '0 6px 24px rgba(75,53,42,0.14), 0 2px 8px rgba(75,53,42,0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{ background: 'rgba(200,164,91,0.25)', border: '1.5px solid rgba(200,164,91,0.5)' }}
                      >
                        <span className="font-display text-sm font-bold" style={{ color: 'var(--primary-bright)' }}>{item.step}</span>
                      </div>
                      <Icon name={item.icon as 'BookOpenIcon'} size={20} className="mx-auto mb-2" style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
                      <h3 className="font-display text-sm font-bold mb-1" style={{ color: 'var(--foreground)' }}>{item.title}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </BookstoreSection>

              {/* ── 6. FAQ Preview — the reading corner ── */}
              <BookstoreDivider label="✦ FAQs ✦" />
              <BookstoreSection style={{ marginBottom: '4rem' }}>
                <div className="text-center mb-6">
                  <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Frequently Asked Questions</h2>
                  <p className="text-sm mb-6 font-serif italic" style={{ color: 'var(--foreground-muted)' }}>Your guide to pre-orders, payments, shipping, and everything in between.</p>
                  <Link
                    href="/faqs"
                    className="inline-flex items-center gap-2 text-sm font-semibold px-8 py-3 rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(200,164,91,0.22) 0%, rgba(175,115,55,0.18) 100%)',
                      border: '1.5px solid rgba(200,164,91,0.55)',
                      color: 'var(--primary-bright)',
                      boxShadow: '0 4px 16px rgba(200,164,91,0.20), 0 1px 4px rgba(75,53,42,0.10), inset 0 1px 0 rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    View All FAQs ✦
                  </Link>
                </div>
                <FAQPreview />
              </BookstoreSection>
            </>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}

// ── Balanced Book Grid ─────────────────────────────────────
function getBalancedCols(count: number): number {
  if (count <= 2) return count;
  if (count === 3) return 3;
  if (count === 4) return 4;
  if (count === 5) return 5;
  if (count === 6) return 3;
  if (count === 7) return 4;
  if (count === 8) return 4;
  if (count === 9) return 3;
  if (count === 10) return 5;
  if (count === 11) return 4;
  if (count === 12) return 4;
  return 5;
}

const COL_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
};

function BalancedBookGrid({ books }: { books: Book[] }) {
  const cols = getBalancedCols(books.length);
  const colClass = COL_CLASSES[cols] ?? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
  return (
    <div className={`grid ${colClass} gap-4`}>
      {books.map(book => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}

// ── FAQ Preview ────────────────────────────────────────────
function FAQPreview() {
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('faqs')
      .select('question, answer')
      .eq('is_visible', true)
      .eq('is_featured', true)
      .order('sort_order', { ascending: true })
      .limit(4)
      .then(({ data }) => setFaqs(data ?? []));
  }, []);

  if (faqs.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(251,245,236,0.22)',
            border: `1px solid ${openIdx === i ? 'rgba(200,164,91,0.5)' : 'rgba(200,164,91,0.2)'}`,
            boxShadow: '0 2px 8px rgba(75,53,42,0.06)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{faq.question}</span>
            <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: openIdx === i ? 'rgba(200,164,91,0.2)' : 'rgba(200,164,91,0.1)', color: 'var(--primary-bright)' }}>
              <Icon name={openIdx === i ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} />
            </span>
          </button>
          {openIdx === i && (
            <div className="px-5 pb-4">
              <div className="w-full h-px mb-3" style={{ background: 'rgba(200,164,91,0.2)' }} />
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Book row mapper ────────────────────────────────────────
function mapBookRow(row: Record<string, unknown>): Book {
  const available = Number(row.inventory ?? 0) - Number(row.reserved ?? 0);
  const arrivalDate = row.arrival_date ? String(row.arrival_date) : null;
  let status: Book['status'] = 'Sold Out';
  if (arrivalDate && new Date(arrivalDate) > new Date()) status = 'Pre-order';
  else if (available > 0) status = 'On Hand';

  return {
    id: String(row.id ?? ''),
    sku: String(row.sku ?? ''),
    title: String(row.title ?? ''),
    author: String(row.author ?? ''),
    genre: String(row.genre ?? ''),
    subgenre: String(row.subgenre ?? ''),
    series: String(row.series ?? ''),
    series_order: row.series_order != null ? Number(row.series_order) : null,
    format: (row.format as Book['format']) ?? 'Paperback',
    edition: String(row.edition ?? ''),
    final_srp: Number(row.final_srp ?? 0),
    batch: String(row.batch ?? ''),
    arrival_date: arrivalDate,
    inventory: Number(row.inventory ?? 0),
    reserved: Number(row.reserved ?? 0),
    synopsis: String(row.synopsis ?? ''),
    cover_url: String(row.cover_url ?? ''),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    available,
    status,
    goodreads_score: row.goodreads_score != null ? Number(row.goodreads_score) : undefined,
  } as Book & { goodreads_score?: number };
}
