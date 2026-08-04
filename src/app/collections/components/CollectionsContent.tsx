'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import StatusBadge from '@/components/books/StatusBadge';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabase';
import { Bundle } from '@/lib/types';

export default function CollectionsContent() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('bundles')
        .select('*, books(*)')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setBundles(data as Bundle[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="content-wrapper py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Curated Sets ✦
        </p>
        <h1 className="font-display text-4xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
          Collections
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          Handpicked bundles of books that belong together — thoughtfully curated and priced better than buying individually.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : bundles.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-xl"
          style={{ border: '1px dashed var(--border)', background: 'var(--background-card)' }}
        >
          <span className="text-4xl mb-4">✦</span>
          <h3 className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>
            No collections yet
          </h3>
          <p className="text-sm" style={{ color: 'var(--foreground-subtle)' }}>
            Curated book bundles will appear here. Check back soon!
          </p>
          <Link href="/shop" className="btn-primary mt-4 text-sm px-6">
            Browse Individual Books
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {bundles.map(bundle => (
            <BundleCard key={`bundle-${bundle.id}`} bundle={bundle} />
          ))}
        </div>
      )}

      {/* Custom bundle CTA */}
      <div
        className="mt-16 rounded-2xl p-8 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(79,70,229,0.08))',
          border: '1px solid rgba(139,92,246,0.25)',
        }}
      >
        <span className="text-3xl mb-4 block" aria-hidden="true">✦</span>
        <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          Want a Custom Bundle?
        </h2>
        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          We can put together a personalized book set just for you — gifts, themed collections, or series sets.
        </p>
        <Link href="/contact" className="btn-primary text-sm px-8 py-3 inline-block">
          Request a Custom Bundle
        </Link>
      </div>
    </div>
  );
}

function BundleCard({ bundle }: { bundle: Bundle }) {
  const [expanded, setExpanded] = useState(false);

  const individualTotal = bundle.books.reduce((sum, b) => sum + b.final_srp, 0);
  const savings = individualTotal - bundle.final_srp;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--background-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Bundle header with cover mosaic */}
      <div className="relative h-48 overflow-hidden">
        {/* Background blur from first cover */}
        <div className="absolute inset-0">
          <AppImage
            src={bundle.cover_url || '/assets/images/no_image.png'}
            alt=""
            fill
            sizes="600px"
            className="object-cover"
            style={{ filter: 'blur(20px) brightness(0.3) saturate(1.5)' } as React.CSSProperties}
          />
        </div>

        {/* Cover mosaic */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 p-6">
          {bundle.books.slice(0, 3).map((book, idx) => (
            <div
              key={`mosaic-${bundle.id}-${book.id}`}
              className="relative rounded-lg overflow-hidden flex-shrink-0"
              style={{
                width: idx === 0 ? '80px' : '64px',
                height: idx === 0 ? '112px' : '90px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                transform: idx === 0 ? 'rotate(-2deg)' : idx === 1 ? 'rotate(1deg)' : 'rotate(-1deg)',
                zIndex: idx === 0 ? 3 : idx === 1 ? 2 : 1,
              }}
            >
              <AppImage
                src={book.cover_url || '/assets/images/no_image.png'}
                alt={`Cover of ${book.title}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={bundle.status} size="sm" />
        </div>

        {/* Savings badge */}
        {savings > 0 && (
          <div
            className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)' }}
          >
            Save ₱{savings.toLocaleString()}
          </div>
        )}
      </div>

      {/* Bundle info */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-display text-xl font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
            {bundle.name}
          </h3>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--primary-bright)' }}>
              ₱{bundle.final_srp.toLocaleString()}
            </p>
            {savings > 0 && (
              <p className="text-xs line-through tabular-nums" style={{ color: 'var(--foreground-subtle)' }}>
                ₱{individualTotal.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
          {bundle.description}
        </p>

        {/* Book count + expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-all text-sm"
          style={{
            background: expanded ? 'rgba(139,92,246,0.08)' : 'var(--muted)',
            border: `1px solid ${expanded ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`,
            color: 'var(--foreground-muted)',
          }}
        >
          <span className="flex items-center gap-2">
            <Icon name="BookOpenIcon" size={15} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
            <span>{bundle.books.length} books included</span>
          </span>
          <Icon
            name={expanded ? 'ChevronUpIcon' : 'ChevronDownIcon'}
            size={16}
            style={{ color: 'var(--primary-bright)' } as React.CSSProperties}
          />
        </button>

        {/* Expanded book list */}
        {expanded && (
          <div className="mt-3 space-y-2 animate-fade-in">
            {bundle.books.map((book) => (
              <Link
                key={`bundle-list-${bundle.id}-${book.id}`}
                href={`/book-detail?id=${book.id}`}
                className="flex items-center gap-3 p-2 rounded-lg transition-all group"
                style={{ background: 'var(--muted)' }}
              >
                <div className="relative w-8 h-12 rounded overflow-hidden flex-shrink-0">
                  <AppImage
                    src={book.cover_url || '/assets/images/no_image.png'}
                    alt={`Cover of ${book.title}`}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold truncate group-hover:text-primary-bright transition-colors"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {book.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--foreground-subtle)' }}>
                    {book.author}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs tabular-nums" style={{ color: 'var(--foreground-muted)' }}>
                    ₱{book.final_srp.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                    {book.format}
                  </p>
                </div>
              </Link>
            ))}

            {/* Total comparison */}
            <div
              className="flex items-center justify-between px-2 py-2 rounded-lg mt-1"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}
            >
              <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                Individual total
              </span>
              <span className="text-xs tabular-nums line-through" style={{ color: 'var(--foreground-subtle)' }}>
                ₱{individualTotal.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-1 text-sm py-2.5 text-center"
          >
            Order Bundle
          </a>
        </div>
      </div>
    </div>
  );
}