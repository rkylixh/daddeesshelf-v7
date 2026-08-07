'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { getBooks, formatBookPrice } from '@/lib/books';
import { Book } from '@/lib/types';

const WISHLIST_KEY = 'ds-wishlist';

function getWishlistIds(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? '[]'); } catch { return []; }
}

function removeFromWishlist(id: string) {
  const current = getWishlistIds();
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(current.filter(i => i !== id)));
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
    <div className="content-wrapper py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Saved Titles ✦
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: '#3A2214' }}>
          My Wishlist
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: '#6B5040', lineHeight: '1.7' }}>
          Books you&apos;ve saved for later. Your wishlist persists across visits until you remove a title.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : books.length === 0 ? (
        <div className="max-w-lg mx-auto space-y-6">
          {/* Empty wishlist card */}
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: 'rgba(251,245,236,0.7)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}
          >
            <span className="text-5xl mb-6 block" aria-hidden="true" style={{ color: '#7B6454' }}>♡</span>
            <h2 className="font-display text-xl font-bold mb-3" style={{ color: '#3A2214' }}>
              Your wishlist is empty
            </h2>
            <p className="text-sm mb-6" style={{ color: '#6B5040', lineHeight: '1.7' }}>
              Browse our collection and tap the heart icon on any book to save it here.
            </p>
            <Link href="/shop" className="btn-primary text-sm px-6 py-2.5 inline-block">
              Browse Books
            </Link>
          </div>

          {/* Request a Title — always visible */}
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(251,245,236,0.7)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
              ✦ Can&apos;t find what you&apos;re looking for? ✦
            </p>
            <h3 className="font-display text-xl font-bold mb-2" style={{ color: '#3A2214' }}>
              Request a Title
            </h3>
            <p className="text-sm mb-5 max-w-sm mx-auto" style={{ color: '#6B5040', lineHeight: '1.7' }}>
              Don&apos;t see the book you want? Send us a request and we&apos;ll do our best to source it for you.
            </p>
            <Link href="/request" className="btn-primary text-sm px-6 py-2.5 inline-block">
              Request a Title
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm mb-6" style={{ color: '#6B5040' }}>
            {books.length} {books.length === 1 ? 'title' : 'titles'} saved
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {books.map(book => (
              <div
                key={book.id}
                className="rounded-xl overflow-hidden group relative"
                style={{ background: 'rgba(251,245,236,0.25)', border: '1px solid rgba(216,196,168,0.5)', backdropFilter: 'blur(6px)', boxShadow: '0 2px 12px rgba(75,53,42,0.08)' }}
              >
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(book.id)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ background: 'rgba(243,231,213,0.9)', border: '1px solid var(--border)' }}
                  title="Remove from wishlist"
                >
                  <Icon name="XMarkIcon" size={14} style={{ color: '#4B352A' } as React.CSSProperties} />
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
                  <div className="p-3" style={{ background: 'rgba(251,245,236,0.15)' }}>
                    <p className="text-xs font-semibold leading-snug mb-0.5 line-clamp-2" style={{ color: '#3A2214' }}>
                      {book.title}
                    </p>
                    <p className="text-xs italic mb-1" style={{ color: '#6B5040' }}>
                      {book.author}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold tabular-nums" style={{ color: '#8B6A20' }}>
                        {formatBookPrice(book)}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          background: book.status === 'On Hand' ? 'rgba(16,185,129,0.15)' : 'rgba(200,164,91,0.15)',
                          color: book.status === 'On Hand' ? '#1a6b4a' : '#7A5A20',
                          border: `1px solid ${book.status === 'On Hand' ? 'rgba(16,185,129,0.35)' : 'rgba(200,164,91,0.35)'}`,
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

          {/* Request a Title CTA */}
          <div
            className="mt-10 rounded-2xl p-8 text-center"
            style={{ background: 'rgba(251,245,236,0.7)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
              ✦ Can&apos;t find what you&apos;re looking for? ✦
            </p>
            <h3 className="font-display text-xl font-bold mb-2" style={{ color: '#3A2214' }}>
              Request a Title
            </h3>
            <p className="text-sm mb-5 max-w-sm mx-auto" style={{ color: '#6B5040', lineHeight: '1.7' }}>
              Don&apos;t see the book you want? Send us a request and we&apos;ll do our best to source it for you.
            </p>
            <Link href="/request" className="btn-primary text-sm px-6 py-2.5 inline-block">
              Request a Title
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link href="/shop" className="btn-secondary text-sm px-6 py-2.5 inline-block">
              Continue Browsing
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
