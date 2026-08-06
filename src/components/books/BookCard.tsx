'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import StatusBadge from './StatusBadge';
import Icon from '@/components/ui/AppIcon';
import { Book } from '@/lib/types';
import { CartContext } from '@/components/layout/Navbar';

const WISHLIST_KEY = 'ds-wishlist';

interface BookCardProps {
  book: Book;
  href?: string;
  showQuickAdd?: boolean;
}

export default function BookCard({ book, href, showQuickAdd = false }: BookCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useContext(CartContext);
  const detailHref = href ?? `/book-detail?id=${book.id}`;

  // Load wishlist state from localStorage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]') as string[];
      setWishlisted(stored.includes(book.id));
    } catch {
      // ignore
    }
  }, [book.id]);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]') as string[];
      const isCurrentlyWishlisted = stored.includes(book.id);
      const updated = isCurrentlyWishlisted
        ? stored.filter(id => id !== book.id)
        : [...stored, book.id];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
      setWishlisted(!isCurrentlyWishlisted);
    } catch {
      // ignore
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(book);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1800);
  };

  return (
    <Link href={detailHref} className="block group">
      <div
        className="card-glow rounded-xl overflow-hidden"
        style={{
          background: 'rgba(251,245,236,0.55)',
          border: '1px solid rgba(216,196,168,0.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {/* Cover */}
        <div className="relative aspect-[2/3] overflow-hidden" style={{ background: 'var(--muted)' }}>
          <AppImage
            src={book.cover_url || '/assets/images/no_image.png'}
            alt={`Cover of ${book.title} by ${book.author}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{
              background: 'rgba(247,239,229,0.92)',
              backdropFilter: 'blur(4px)',
              border: `1px solid ${wishlisted ? 'rgba(200,164,91,0.7)' : 'var(--border)'}`,
              boxShadow: '0 2px 8px rgba(75,53,42,0.15)',
            }}
          >
            <Icon
              name="HeartIcon"
              size={16}
              variant={wishlisted ? 'solid' : 'outline'}
              style={{ color: wishlisted ? 'var(--primary-bright)' : 'var(--foreground-muted)' } as React.CSSProperties}
            />
          </button>
          {/* Status overlay */}
          <div className="absolute bottom-2 left-2">
            <StatusBadge status={book.status!} size="sm" />
          </div>
        </div>

        {/* Info — translucent parchment card style */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(216,196,168,0.5)' }}>
          <p
            className="text-xs font-medium mb-0.5 truncate"
            style={{ color: 'var(--foreground-subtle)', letterSpacing: '0.03em' }}
          >
            {book.genre}
            {book.format !== 'Paperback' && (
              <span className="ml-1.5 text-xs" style={{ color: 'var(--accent-light)' }}>
                · {book.format}
              </span>
            )}
          </p>
          <h3
            className="font-display text-sm font-semibold leading-snug mb-0.5 line-clamp-2"
            style={{ color: 'var(--foreground)' }}
          >
            {book.title}
          </h3>
          <p className="text-xs mb-2 truncate font-serif italic" style={{ color: 'var(--foreground-muted)' }}>
            {book.author}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--primary-bright)' }}>
              ₱{book.final_srp.toLocaleString()}
            </span>
            {book.series && (
              <span className="text-xs truncate max-w-[100px]" style={{ color: 'var(--foreground-subtle)' }}>
                {book.series}
              </span>
            )}
          </div>

          {/* Quick Add to Cart */}
          {showQuickAdd && (
            <button
              onClick={handleQuickAdd}
              className="mt-2 w-full text-xs py-1.5 rounded-lg font-semibold transition-all duration-200"
              style={{
                background: addedToCart
                  ? 'rgba(90,138,74,0.12)'
                  : 'rgba(200,164,91,0.12)',
                color: addedToCart ? 'var(--status-onhand)' : 'var(--primary-bright)',
                border: `1px solid ${addedToCart ? 'rgba(90,138,74,0.35)' : 'rgba(200,164,91,0.35)'}`,
              }}
            >
              {addedToCart ? '✓ Added to Cart' : '+ Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}