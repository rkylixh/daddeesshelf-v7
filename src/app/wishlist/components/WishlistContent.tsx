'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { getBooks } from '@/lib/books';
import { Book } from '@/lib/types';

function getWishlistIds(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('wishlist_ids') ?? '[]'); } catch { return []; }
}

function removeFromWishlist(id: string) {
  const current = getWishlistIds();
  localStorage.setItem('wishlist_ids', JSON.stringify(current.filter(i => i !== id)));
}

// ── Animated galaxy/star background ──────────────────────────────────────────
interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (i * 13.7 + 3) % 100,
    y: (i * 7.3 + 11) % 100,
    size: i % 11 === 0 ? 2.5 : i % 5 === 0 ? 1.8 : i % 3 === 0 ? 1.4 : 1,
    opacity: 0.12 + (i % 7) * 0.06,
    duration: 5 + (i % 11),
    delay: (i % 50) * 0.22,
    drift: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5)),
  }));
}

const STARS = generateStars(80);

function WishlistBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Deep warm parchment base */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 90% 60% at 50% 10%, rgba(200,164,91,0.09) 0%, transparent 65%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(168,116,69,0.06) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 80% 60%, rgba(216,180,108,0.05) 0%, transparent 50%)',
      }} />
      {/* Soft light ray from top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '35%',
        width: '30%',
        height: '70%',
        background: 'linear-gradient(180deg, rgba(200,164,91,0.07) 0%, transparent 100%)',
        transform: 'skewX(-8deg)',
        filter: 'blur(40px)',
      }} />
      {/* Floating stars / dust motes */}
      {STARS.map(star => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            top: `${star.y}%`,
            left: `${star.x}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            background: 'var(--star-color)',
            opacity: star.opacity,
            animation: `wishlist-star-drift ${star.duration}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function WishlistContent() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    const ids = getWishlistIds();
    setWishlistIds(ids);
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    async function loadBooks() {
      const all = await getBooks({});
      setBooks(all.filter(b => ids.includes(b.id)));
      setLoading(false);
    }
    loadBooks();
  }, []);

  const handleRemove = (id: string) => {
    removeFromWishlist(id);
    setBooks(prev => prev.filter(b => b.id !== id));
    setWishlistIds(prev => prev.filter(i => i !== id));
  };

  return (
    <>
      {/* Animated background */}
      <WishlistBackground />

      {/* Keyframes injected inline */}
      <style>{`
        @keyframes wishlist-star-drift {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: var(--base-op, 0.15); }
          25%       { transform: translateY(-14px) translateX(5px); opacity: calc(var(--base-op, 0.15) * 2.2); }
          50%       { transform: translateY(-8px) translateX(-4px); opacity: calc(var(--base-op, 0.15) * 0.8); }
          75%       { transform: translateY(-20px) translateX(7px); opacity: calc(var(--base-op, 0.15) * 1.8); }
        }
      `}</style>

      <div className="content-wrapper" style={{ paddingTop: '4rem', paddingBottom: '3rem', position: 'relative', zIndex: 1 }}>
        {/* Header — extra top spacing so "Saved Titles" doesn't touch the navbar */}
        <div className="text-center mb-12" style={{ paddingTop: '2rem' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
            ✦ Saved Titles ✦
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            My Wishlist
          </h1>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
            Books you&apos;ve saved for later. Your wishlist persists across visits until you remove a title.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
          </div>
        ) : books.length === 0 ? (
          <div
            className="max-w-md mx-auto rounded-2xl p-12 text-center"
            style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
          >
            <span className="text-5xl mb-6 block" aria-hidden="true">♡</span>
            <h2 className="font-display text-xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
              Your wishlist is empty
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
              Browse our collection and tap the heart icon on any book to save it here.
            </p>
            <Link href="/shop" className="btn-primary text-sm px-6 py-2.5 inline-block">
              Browse Books
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
              {books.length} {books.length === 1 ? 'title' : 'titles'} saved
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {books.map(book => (
                <div
                  key={book.id}
                  className="rounded-xl overflow-hidden group relative"
                  style={{ background: 'var(--background-card)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(75,53,42,0.08)' }}
                >
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(book.id)}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                    style={{ background: 'rgba(243,231,213,0.9)', border: '1px solid var(--border)' }}
                    title="Remove from wishlist"
                  >
                    <Icon name="XMarkIcon" size={14} style={{ color: 'var(--foreground-muted)' } as React.CSSProperties} />
                  </button>

                  <Link href={`/book-detail?id=${book.id}`}>
                    <div className="relative aspect-[2/3]">
                      <AppImage
                        src={book.cover_url || '/assets/images/no_image.png'}
                        alt={`Cover of ${book.title} by ${book.author}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold leading-snug mb-0.5 line-clamp-2" style={{ color: 'var(--foreground)' }}>
                        {book.title}
                      </p>
                      <p className="text-xs italic mb-1" style={{ color: 'var(--foreground-muted)' }}>
                        {book.author}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--primary-bright)' }}>
                          ₱{book.final_srp.toLocaleString()}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            background: book.status === 'On Hand' ? 'rgba(16,185,129,0.12)' : 'rgba(200,164,91,0.12)',
                            color: book.status === 'On Hand' ? '#10b981' : 'var(--primary-bright)',
                            border: `1px solid ${book.status === 'On Hand' ? 'rgba(16,185,129,0.3)' : 'rgba(200,164,91,0.3)'}`,
                          }}
                        >
                          {book.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/shop" className="btn-secondary text-sm px-6 py-2.5 inline-block">
                Continue Browsing
              </Link>
            </div>
          </div>
        )}

        {/* ── Request a Title CTA ─────────────────────────────────────────── */}
        <div
          className="mt-16 max-w-xl mx-auto rounded-2xl p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(200,164,91,0.08) 0%, rgba(168,116,69,0.06) 100%)',
            border: '1px solid rgba(200,164,91,0.3)',
            boxShadow: '0 4px 24px rgba(75,53,42,0.08)',
          }}
        >
          <span className="text-3xl mb-4 block" aria-hidden="true">✦</span>
          <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Can&apos;t Find What You&apos;re Looking For?
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
            Don&apos;t see the book you want in our collection? Submit a title request and we&apos;ll try to include it in our next import batch.
          </p>
          <Link href="/request" className="btn-primary text-sm px-7 py-2.5 inline-block">
            Request a Title ✦
          </Link>
        </div>
      </div>
    </>
  );
}
