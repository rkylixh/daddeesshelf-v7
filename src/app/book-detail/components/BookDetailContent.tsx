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
      if (!id) {
        setLoading(false);
        return;
      }
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

  const metaRows = [
    { label: 'Author', value: book.author },
    { label: 'Genre', value: book.genre },
    { label: 'Subgenre', value: book.subgenre || '—' },
    { label: 'Series', value: book.series || '—' },
    { label: 'Series Order', value: book.series_order ? `Book ${book.series_order}` : '—' },
    { label: 'Format', value: book.format },
    { label: 'Edition', value: book.edition || '—' },
    { label: 'SKU', value: book.sku },
    { label: 'Batch', value: book.batch || '—' },
    ...(book.arrival_date ? [{ label: 'Arrival Date', value: new Date(book.arrival_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) }] : []),
  ];

  const spiceLevel = (book as Book & { spice_level?: number }).spice_level ?? 0;
  const goodreadsUrl = (book as Book & { goodreads_url?: string }).goodreads_url ?? '';
  const goodreadsScore = book.goodreads_score ?? 0;

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
        {/* Cover */}
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

        {/* Details */}
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
                {book.status === 'Sold Out' ?'Join the wishlist to be notified when available' :'Add to cart · Pay via GCash · Shipping collected after arrival'}
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

          {/* Synopsis */}
          {book.synopsis && (
            <div className="mb-8">
              <h2 className="font-display text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                Synopsis
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)', lineHeight: '1.8' }}>
                {book.synopsis}
              </p>
            </div>
          )}

          {/* Metadata table */}
          <div
            className="rounded-xl overflow-hidden mb-6"
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
                  <span className="w-32 flex-shrink-0 font-medium" style={{ color: 'var(--foreground-subtle)' }}>
                    {row.label}
                  </span>
                  <span style={{ color: 'var(--foreground-muted)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related books */}
      {relatedBooks.length > 0 && (
        <div className="mt-16">
          <div className="celestial-divider">
            <span className="text-sm tracking-widest">✦ More in {book.genre} ✦</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-6">
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