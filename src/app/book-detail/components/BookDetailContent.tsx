'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import StatusBadge from '@/components/books/StatusBadge';
import Icon from '@/components/ui/AppIcon';
import { getBookById, getBooks } from '@/lib/books';
import { Book } from '@/lib/types';
import { CartContext } from '@/components/layout/Navbar';

// ── Reader Tags ────────────────────────────────────────────
const READER_TAG_COLORS: Record<string, string> = {
  'Slow Burn Romance': '#8b5cf6',
  'Enemies to Lovers': '#ef4444',
  'Found Family': '#10b981',
  'Morally Gray Characters': '#6b7280',
  'Strong Female Lead': '#f59e0b',
  'Emotional Rollercoaster': '#3b82f6',
  'Plot Twists': '#ec4899',
  'Political Intrigue': '#6366f1',
  'Cozy Fantasy': '#84cc16',
  'Whimsical World': '#a78bfa',
  'Heartbreaking Ending': '#64748b',
  'High Stakes': '#dc2626',
  'Dual POV': '#0ea5e9',
  'Single POV': '#0ea5e9',
  'Multi POV': '#0ea5e9',
  'Fantasy Romance': '#d946ef',
  'Dark Academia': '#78716c',
  'Gothic Atmosphere': '#44403c',
  'Mystery': '#7c3aed',
  'Adventure': '#f97316',
  'Banter': '#facc15',
  'Grumpy x Sunshine': '#fb923c',
  'Marriage of Convenience': '#f472b6',
  'Fake Dating': '#fb7185',
  'Friends to Lovers': '#34d399',
  'Forbidden Romance': '#f43f5e',
  'Rivals to Lovers': '#e879f9',
  'Dragons': '#dc2626',
  'Vampires': '#991b1b',
  'Witches': '#7c3aed',
  'Fae': '#a78bfa',
  'Academy Setting': '#3b82f6',
  'Slow Worldbuilding': '#6b7280',
  'Fast-Paced': '#f97316',
  'Character-Driven': '#10b981',
  'Plot-Driven': '#6366f1',
  'Touch Her and Die': '#ef4444',
  "Who Did This to You?": '#dc2626',
  'Slow Burn': '#8b5cf6',
  'Emotional': '#3b82f6',
  'Political Fantasy': '#6366f1',
  'Character Driven': '#10b981',
};

// ── Reading Experience Bar ─────────────────────────────────
function ExperienceBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const getColor = () => {
    if (pct < 0.3) return '#10b981';
    if (pct < 0.6) return '#f59e0b';
    if (pct < 0.85) return '#f97316';
    return '#ef4444';
  };
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-36 flex-shrink-0" style={{ color: 'var(--foreground-muted)' }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct * 100}%`, background: `linear-gradient(90deg, ${getColor()}, ${getColor()}cc)` }}
        />
      </div>
      <span className="text-xs w-8 text-right tabular-nums" style={{ color: 'var(--foreground-subtle)' }}>
        {value}/{max}
      </span>
    </div>
  );
}

// ── ETA Disclaimer — displayed ONCE, directly beneath the ETA field ──
function ETADisclaimer() {
  return (
    <div
      className="rounded-lg p-3 mt-2"
      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
    >
      <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-subtle)' }}>
        <span className="font-semibold" style={{ color: '#f59e0b' }}>⚠ ETA Disclaimer: </span>
        Estimated arrival dates are tentative and may change due to international shipping, customs clearance, weather conditions, carrier delays, or other unforeseen circumstances. ETAs are provided for planning purposes only and should not be interpreted as guaranteed arrival dates.
      </p>
    </div>
  );
}

export default function BookDetailContent() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';

  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useContext(CartContext);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (!id) { setLoading(false); return; }
      const data = await getBookById(id);
      setBook(data);
      if (data) {
        const all = await getBooks({ genre: data.genre });
        setRelatedBooks(all.filter(b => b.id !== data.id).slice(0, 6));
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handlePreorder = () => {
    if (!book) return;
    addItem(book);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <div className="content-wrapper py-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="content-wrapper py-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <span className="text-4xl mb-4">✦</span>
        <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--foreground-muted)' }}>Book not found</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--foreground-subtle)' }}>This title may no longer be available.</p>
        <Link href="/shop" className="btn-primary text-sm px-6">Browse All Books</Link>
      </div>
    );
  }

  const extBook = book as Book & {
    spice_level?: number;
    goodreads_url?: string;
    goodreads_ratings_count?: number;
    content_warnings?: string;
    reading_age?: string;
    quotes?: string[];
    reader_tags?: string[];
    why_readers_love?: string;
    emotional_intensity?: number;
    romance_level?: number;
    worldbuilding_complexity?: number;
    pace?: number;
    humor?: number;
    darkness?: number;
    action?: number;
  };

  const spiceLevel = extBook.spice_level ?? 0;
  const goodreadsUrl = extBook.goodreads_url ?? (book as any).goodreads_link ?? '';
  const goodreadsScore = book.goodreads_score ?? 0;
  const goodreadsRatingsCount = extBook.goodreads_ratings_count ?? 0;
  const readerTags: string[] = extBook.reader_tags ?? [];
  const quotes: string[] = extBook.quotes ?? [];
  const whyReadersLove = extBook.why_readers_love ?? '';
  const hasReadingExperience = (extBook.emotional_intensity ?? 0) > 0 ||
    (extBook.romance_level ?? 0) > 0 ||
    (extBook.worldbuilding_complexity ?? 0) > 0 ||
    (extBook.pace ?? 0) > 0;

  // Metadata rows — ETA is the last row so the disclaimer appears directly beneath it
  const metaRows = [
    { label: 'Author', value: book.author },
    { label: 'Genre', value: book.genre },
    { label: 'Subgenre', value: book.subgenre || '—' },
    { label: 'Series', value: book.series || '—' },
    { label: 'Series Order', value: book.series_order ? `Book ${book.series_order}` : '—' },
    { label: 'Format', value: book.format },
    { label: 'Edition', value: book.edition || '—' },
    { label: 'Book Code', value: book.sku },
    { label: 'Batch', value: book.batch || '—' },
    ...(extBook.reading_age ? [{ label: 'Reading Age', value: extBook.reading_age }] : []),
    ...(extBook.content_warnings ? [{ label: 'Content Warnings', value: extBook.content_warnings }] : []),
    ...(book.arrival_date ? [{ label: 'Estimated Arrival (ETA)', value: new Date(book.arrival_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) }] : []),
  ];

  return (
    <div className="content-wrapper py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        <Link href="/" className="nav-link">Home</Link>
        <span style={{ color: 'var(--foreground-subtle)' }}>›</span>
        <Link href="/shop" className="nav-link">Shop</Link>
        <span style={{ color: 'var(--foreground-subtle)' }}>›</span>
        <span className="truncate max-w-xs" style={{ color: 'var(--foreground-muted)' }}>{book.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[380px_1fr] gap-10">
        {/* Cover column */}
        <div className="flex flex-col items-center lg:items-start gap-4">
          <div
            className="relative w-full max-w-[320px] aspect-[2/3] rounded-xl overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(139,92,246,0.3), 0 8px 30px rgba(0,0,0,0.6)' }}
          >
            <AppImage
              src={book.cover_url || '/assets/images/no_image.png'}
              alt={`Cover of ${book.title} by ${book.author}`}
              fill
              sizes="(max-width: 1024px) 80vw, 380px"
              className="object-cover"
              priority
            />
          </div>

          {/* Preorder / Add to Cart button */}
          {book.status !== 'Sold Out' && (
            <button
              onClick={handlePreorder}
              className="w-full max-w-[320px] btn-primary flex items-center justify-center gap-2 py-3 text-sm"
            >
              <Icon name="ShoppingCartIcon" size={16} />
              {addedToCart ? 'Added to Cart ✓' : book.status === 'Pre-order' ? 'Preorder This Book ✦' : 'Add to Cart ✦'}
            </button>
          )}

          {/* Share */}
          <button className="w-full max-w-[320px] btn-ghost flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm">
            <Icon name="ShareIcon" size={16} />
            Share this book
          </button>
        </div>

        {/* Details column */}
        <div>
          {/* Status + Genre tags */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <StatusBadge status={book.status!} />
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }}
            >
              {book.genre}
            </span>
            {book.subgenre && (
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--muted)', color: 'var(--foreground-subtle)', border: '1px solid var(--border)' }}
              >
                {book.subgenre}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2 leading-tight" style={{ color: 'var(--foreground)' }}>
            {book.title}
          </h1>

          <p className="text-lg font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
            by {book.author}
          </p>

          {book.series && (
            <p className="text-sm mb-4" style={{ color: 'var(--accent-light)' }}>
              {book.series}{book.series_order ? ` — Book ${book.series_order}` : ''}
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-display text-3xl font-bold tabular-nums" style={{ color: 'var(--primary-bright)' }}>
              ₱{book.final_srp.toLocaleString()}
            </span>
            <span className="text-sm" style={{ color: 'var(--foreground-subtle)' }}>
              {book.format}
            </span>
          </div>

          {/* Goodreads Rating */}
          {goodreadsScore > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5">
                <Icon name="StarIcon" size={16} style={{ color: '#f59e0b' } as React.CSSProperties} />
                <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{goodreadsScore.toFixed(2)}</span>
                <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>on Goodreads</span>
                {goodreadsRatingsCount > 0 && (
                  <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                    ({goodreadsRatingsCount.toLocaleString()} ratings)
                  </span>
                )}
              </div>
              {goodreadsUrl && (
                <a
                  href={goodreadsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold"
                  style={{ color: 'var(--primary-bright)' }}
                >
                  View on Goodreads →
                </a>
              )}
            </div>
          )}

          {/* Spice Rating */}
          {spiceLevel > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold" style={{ color: 'var(--foreground-subtle)' }}>Spice Level:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-sm" style={{ opacity: i < spiceLevel ? 1 : 0.2 }}>🌶️</span>
                ))}
              </div>
              <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>({spiceLevel}/5)</span>
            </div>
          )}

          {/* Order CTA */}
          <div
            className="rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <div className="flex-1">
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                {book.status === 'Pre-order' ? 'Reserve your copy now'
                  : book.status === 'On Hand'
                  ? `${book.available} copies available`
                  : 'Currently out of stock'}
              </p>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                {book.status === 'Sold Out' ?'Join the wishlist to be notified when available' :'Add to cart · Pay via GCash · Shipping information is requested only after your books arrive in the Philippines.'}
              </p>
            </div>
            {book.status !== 'Sold Out' ? (
              <button
                onClick={handlePreorder}
                className="btn-primary whitespace-nowrap text-sm px-6 py-2.5"
              >
                {addedToCart ? 'Added ✓' : 'Preorder Now ✦'}
              </button>
            ) : (
              <Link href="/wishlist" className="btn-secondary whitespace-nowrap text-sm px-6 py-2.5">
                Join Waitlist
              </Link>
            )}
          </div>

          {/* About the Book */}
          {book.synopsis && (
            <div className="mt-8 mb-8">
              <h2 className="font-display text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                About the Book
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)', lineHeight: '1.8' }}>
                {book.synopsis}
              </p>
            </div>
          )}

          {/* Quotes — fair use only, omit section if no quotes */}
          {quotes.length > 0 && (
            <div className="mb-8">
              {quotes.slice(0, 2).map((quote, i) => (
                <blockquote
                  key={i}
                  className="rounded-xl px-5 py-4 mb-3 italic text-sm leading-relaxed"
                  style={{
                    background: 'rgba(139,92,246,0.06)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderLeft: '3px solid var(--primary)',
                    color: 'var(--foreground-muted)',
                  }}
                >
                  &ldquo;{quote}&rdquo;
                </blockquote>
              ))}
            </div>
          )}

          {/* Why Readers Love This Book */}
          {(readerTags.length > 0 || whyReadersLove) && (
            <div className="mb-8">
              <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <span aria-hidden="true">❤️</span> Why Readers Love This Book
              </h2>

              {/* Reader tags */}
              {readerTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {readerTags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{
                        background: `${READER_TAG_COLORS[tag] ?? '#8b5cf6'}22`,
                        color: READER_TAG_COLORS[tag] ?? 'var(--primary-bright)',
                        border: `1px solid ${READER_TAG_COLORS[tag] ?? '#8b5cf6'}44`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Why readers love paragraph */}
              {whyReadersLove && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)', lineHeight: '1.8' }}>
                  {whyReadersLove}
                </p>
              )}
            </div>
          )}

          {/* Reading Experience */}
          {hasReadingExperience && (
            <div className="mb-8">
              <h2 className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                Reading Experience
              </h2>
              <div
                className="rounded-xl p-5 space-y-3"
                style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
              >
                {(extBook.emotional_intensity ?? 0) > 0 && (
                  <ExperienceBar label="Emotional Intensity" value={extBook.emotional_intensity!} />
                )}
                {(extBook.romance_level ?? 0) > 0 && (
                  <ExperienceBar label="Romance Level" value={extBook.romance_level!} />
                )}
                {(extBook.worldbuilding_complexity ?? 0) > 0 && (
                  <ExperienceBar label="Worldbuilding" value={extBook.worldbuilding_complexity!} />
                )}
                {(extBook.pace ?? 0) > 0 && (
                  <ExperienceBar label="Pace" value={extBook.pace!} />
                )}
                {(extBook.humor ?? 0) > 0 && (
                  <ExperienceBar label="Humor" value={extBook.humor!} />
                )}
                {(extBook.darkness ?? 0) > 0 && (
                  <ExperienceBar label="Darkness" value={extBook.darkness!} />
                )}
                {(extBook.action ?? 0) > 0 && (
                  <ExperienceBar label="Action" value={extBook.action!} />
                )}
              </div>
            </div>
          )}

          {/* Metadata table */}
          <div
            className="rounded-xl overflow-hidden mb-4"
            style={{ border: '1px solid var(--border)' }}
          >
            <div
              className="px-4 py-3"
              style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>
                Book Details
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {metaRows.map(row => (
                <div
                  key={`detail-${row.label}`}
                  className="flex px-4 py-2.5 text-sm"
                >
                  <span className="w-40 flex-shrink-0 font-medium" style={{ color: 'var(--foreground-subtle)' }}>
                    {row.label}
                  </span>
                  <span style={{ color: 'var(--foreground-muted)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ETA Disclaimer — displayed ONCE, directly beneath the metadata table (which ends with ETA row) */}
          {book.arrival_date && <ETADisclaimer />}
        </div>
      </div>

      {/* Related books */}
      {relatedBooks.length > 0 && (
        <div className="mt-16">
          <div className="celestial-divider">
            <span className="text-sm tracking-widest">✦ More in {book.genre} ✦</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
            {relatedBooks.map(related => (
              <Link key={`related-${related.id}`} href={`/book-detail?id=${related.id}`} className="block group">
                <div className="card-glow rounded-xl overflow-hidden" style={{ background: 'var(--background-card)' }}>
                  <div className="relative aspect-[2/3]">
                    <AppImage
                      src={related.cover_url || '/assets/images/no_image.png'}
                      alt={`Cover of ${related.title} by ${related.author}`}
                      fill
                      sizes="200px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>{related.title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>{related.author}</p>
                    <p className="text-xs font-bold tabular-nums mt-1" style={{ color: 'var(--primary-bright)' }}>₱{related.final_srp.toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}