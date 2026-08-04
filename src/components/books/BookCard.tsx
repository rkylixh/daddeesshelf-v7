'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import StatusBadge from './StatusBadge';
import Icon from '@/components/ui/AppIcon';
import { Book } from '@/lib/types';

interface BookCardProps {
  book: Book;
  href?: string;
}

export default function BookCard({ book, href }: BookCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const detailHref = href ?? `/book-detail?id=${book.id}`;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setWishlisted(w => !w);
    // BACKEND INTEGRATION POINT: persist wishlist to localStorage
    const key = 'ds-wishlist';
    const stored = JSON.parse(localStorage.getItem(key) || '[]') as string[];
    const updated = wishlisted
      ? stored.filter(id => id !== book.id)
      : [...stored, book.id];
    localStorage.setItem(key, JSON.stringify(updated));
  };

  return (
    <Link href={detailHref} className="block group">
      <div className="card-glow rounded-xl overflow-hidden" style={{ background: 'var(--background-card)' }}>
        {/* Cover */}
        <div className="relative aspect-[2/3] overflow-hidden">
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
            style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(4px)', border: '1px solid var(--border)' }}
          >
            <Icon
              name="HeartIcon"
              size={16}
              variant={wishlisted ? 'solid' : 'outline'}
              style={{ color: wishlisted ? '#8b5cf6' : 'var(--foreground-muted)' } as React.CSSProperties}
            />
          </button>
          {/* Status overlay */}
          <div className="absolute bottom-2 left-2">
            <StatusBadge status={book.status!} size="sm" />
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
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
          <p className="text-xs mb-2 truncate" style={{ color: 'var(--foreground-muted)' }}>
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
        </div>
      </div>
    </Link>
  );
}