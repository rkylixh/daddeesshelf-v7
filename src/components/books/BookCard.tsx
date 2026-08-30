'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import StatusBadge from './StatusBadge';
import Icon from '@/components/ui/AppIcon';
import { Book } from '@/lib/types';
import { CartContext } from '@/components/layout/Navbar';
import { WishlistAccountPrompt, WISHLIST_KEY, WISHLIST_ACCOUNT_KEY } from '@/components/layout/Navbar';
import { isPriceVisible, canPurchase } from '@/lib/books';

interface BookCardProps {
  book: Book;
  href?: string;
  showQuickAdd?: boolean;
  batchLabel?: string;
}

export default function BookCard({ book, href, showQuickAdd = false, batchLabel }: BookCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showWishlistPrompt, setShowWishlistPrompt] = useState(false);
  const { addItem } = useContext(CartContext);
  const detailHref = href ?? `/book-detail?id=${book.id}`;
  const isSoldOut = book.status === 'Sold Out';

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

    // If already wishlisted, toggle off directly
    if (wishlisted) {
      try {
        const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]') as string[];
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(stored.filter(id => id !== book.id)));
        setWishlisted(false);
      } catch { /* ignore */ }
      return;
    }

    // Check if account already registered
    try {
      const account = localStorage.getItem(WISHLIST_ACCOUNT_KEY);
      if (account) {
        const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]') as string[];
        if (!stored.includes(book.id)) {
          localStorage.setItem(WISHLIST_KEY, JSON.stringify([...stored, book.id]));
        }
        setWishlisted(true);
        return;
      }
    } catch { /* ignore */ }

    // No account yet — show prompt
    setShowWishlistPrompt(true);
  };

  const handleWishlistSaved = () => {
    setWishlisted(true);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canPurchase(book)) return;
    addItem(book);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1800);
  };

  const priceVisible = isPriceVisible(book);

  // For on-hand books, prefer onhand_price over final_srp
  const displayPrice = book.status === 'On Hand' && book.onhand_price != null && book.onhand_price > 0
    ? book.onhand_price
    : book.final_srp;

  return (
    <>
      <Link href={detailHref} className="block group">
        <div
          className="card-glow rounded-xl overflow-hidden"
          style={{
            background: 'rgba(251,245,236,0.18)',
            border: isSoldOut ? '1px solid rgba(220,38,38,0.35)' : '1px solid rgba(216,196,168,0.4)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          {/* Cover */}
          <div className="relative aspect-[2/3] overflow-hidden" style={{ background: 'rgba(200,180,150,0.2)' }}>
            <AppImage
              src={book.cover_url || '/assets/images/no_image.png'}
              alt={`Cover of ${book.title} by ${book.author}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isSoldOut ? 'opacity-60 grayscale-[30%]' : ''}`}
            />

            {/* Sold-out diagonal overlay */}
            {isSoldOut && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(220,38,38,0.18) 100%)',
                }}
              />
            )}

            {/* Wishlist button — always visible */}
            <button
              onClick={handleWishlist}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className="absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200"
              style={{
                background: wishlisted ? 'rgba(200,164,91,0.92)' : 'rgba(247,239,229,0.92)',
                backdropFilter: 'blur(4px)',
                border: `1px solid ${wishlisted ? 'rgba(200,164,91,0.9)' : 'var(--border)'}`,
                boxShadow: '0 2px 8px rgba(75,53,42,0.2)',
                opacity: 1,
              }}
            >
              <Icon
                name="HeartIcon"
                size={16}
                variant={wishlisted ? 'solid' : 'outline'}
                style={{ color: wishlisted ? '#fff' : '#7B6454' } as React.CSSProperties}
              />
            </button>

            {/* Status overlay */}
            <div className="absolute bottom-2 left-2">
              <StatusBadge status={book.status!} size="sm" available={book.status === 'Pre-order' ? (book.available ?? 0) : undefined} />
            </div>
          </div>

          {/* Cover disclaimer — info button with hover tooltip */}
          <div className="flex items-center justify-between px-1.5 pt-1 pb-0.5">
            {batchLabel ? (
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded"
                style={{
                  fontSize: '0.62rem',
                  color: 'var(--primary-bright)',
                  background: 'rgba(184,134,11,0.12)',
                  border: '1px solid rgba(184,134,11,0.3)',
                  letterSpacing: '0.02em',
                }}
              >
                {batchLabel}
              </span>
            ) : (
              <span />
            )}
            <div className="relative group/disclaimer">
              <button
                aria-label="Cover disclaimer"
                className="flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold leading-none"
                style={{
                  background: 'rgba(123,100,84,0.15)',
                  color: 'var(--foreground-subtle)',
                  border: '1px solid rgba(123,100,84,0.25)',
                  fontSize: '0.6rem',
                }}
                tabIndex={-1}
              >
                i
              </button>
              <div
                className="absolute bottom-full right-0 mb-1.5 w-44 rounded-lg px-2.5 py-2 text-center pointer-events-none opacity-0 group-hover/disclaimer:opacity-100 transition-opacity duration-150 z-10"
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--foreground-muted)',
                  background: 'var(--background-card)',
                  border: '1px solid rgba(216,196,168,0.4)',
                  boxShadow: '0 4px 12px rgba(75,53,42,0.18)',
                  lineHeight: 1.4,
                }}
              >
                Cover shown for reference only. Actual edition/cover may vary.
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-3" style={{ borderTop: '1px solid rgba(216,196,168,0.35)', background: 'rgba(251,245,236,0.12)' }}>
            <p
              className="text-xs font-medium mb-0.5 truncate"
              style={{ color: '#7B6454', letterSpacing: '0.03em' }}
            >
              {book.genre}
              {book.format !== 'Paperback' && (
                <span className="ml-1.5 text-xs" style={{ color: '#A87445' }}>
                  · {book.format}
                </span>
              )}
            </p>
            <h3
              className="font-display text-sm font-semibold leading-snug mb-0.5 line-clamp-2"
              style={{ color: '#3A2214' }}
            >
              {book.title}
            </h3>
            <p className="text-xs mb-2 truncate font-serif italic" style={{ color: '#6B5040' }}>
              {book.author}
            </p>
            <div className="flex items-center justify-between">
              {priceVisible ? (
                <span className="text-sm font-bold tabular-nums" style={{ color: '#8B6A20' }}>
                  ₱{displayPrice.toLocaleString()}
                </span>
              ) : (
                <span className="text-sm font-medium" style={{ color: '#7B6454' }}>Price TBA</span>
              )}
              {book.series && (
                <span className="text-xs truncate max-w-[100px]" style={{ color: '#7B6454' }}>
                  {book.series}
                </span>
              )}
            </div>

            {/* Quick Add / Add to Wishlist for sold-out */}
            {showQuickAdd && (
              isSoldOut ? (
                <button
                  onClick={handleWishlist}
                  className="mt-2 w-full text-xs py-1.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
                  style={
                    wishlisted
                      ? {
                          background: 'rgba(200,164,91,0.18)',
                          color: '#8B6A20',
                          border: '1px solid rgba(200,164,91,0.45)',
                        }
                      : {
                          background: 'rgba(220,38,38,0.10)',
                          color: '#ef4444',
                          border: '1px solid rgba(220,38,38,0.35)',
                        }
                  }
                >
                  <Icon name="HeartIcon" size={12} variant={wishlisted ? 'solid' : 'outline'} />
                  {wishlisted ? 'Wishlisted ✓' : 'Add to Wishlist'}
                </button>
              ) : (
                <button
                  onClick={priceVisible ? handleQuickAdd : undefined}
                  disabled={!priceVisible}
                  className="mt-2 w-full text-xs py-1.5 rounded-lg font-semibold transition-all duration-200"
                  style={
                    !priceVisible
                      ? {
                          background: 'rgba(120,100,80,0.10)',
                          color: '#9E8E7E',
                          border: '1px solid rgba(120,100,80,0.25)',
                          cursor: 'not-allowed',
                          opacity: 0.55,
                        }
                      : addedToCart
                      ? {
                          background: 'rgba(90,138,74,0.18)',
                          color: '#3d7a2e',
                          border: '1px solid rgba(90,138,74,0.45)',
                        }
                      : {
                          background: 'rgba(200,164,91,0.18)',
                          color: '#8B6A20',
                          border: '1px solid rgba(200,164,91,0.45)',
                        }
                  }
                >
                  {!priceVisible ? 'Price TBA' : addedToCart ? '✓ Added to Cart' : '+ Add to Cart'}
                </button>
              )
            )}
          </div>
        </div>
      </Link>

      {/* Wishlist Account Prompt */}
      {showWishlistPrompt && (
        <WishlistAccountPrompt
          bookId={book.id}
          onClose={() => setShowWishlistPrompt(false)}
          onSaved={handleWishlistSaved}
        />
      )}
    </>
  );
}