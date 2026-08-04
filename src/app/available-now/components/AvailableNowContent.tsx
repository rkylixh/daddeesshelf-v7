'use client';

import React, { useEffect, useState } from 'react';
import BookGrid from '@/components/books/BookGrid';
import { getBooks } from '@/lib/books';
import { Book } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';

export default function AvailableNowContent() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await getBooks();
        setBooks(all.filter(b => b.status === 'On Hand'));
      } catch {
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="content-wrapper py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Ready to Ship ✦
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Available Now
        </h1>
        <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          These books are on hand and ready to ship. No waiting — grab them before they&apos;re gone!
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-24">
          <Icon name="ArchiveBoxIcon" size={48} className="mx-auto mb-4" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
          <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--foreground-muted)' }}>
            No Books Available Right Now
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--foreground-subtle)' }}>
            We&apos;re currently operating in preorder mode. Check back when the next batch arrives!
          </p>
          <a href="/shop" className="btn-primary text-sm px-8 py-3 inline-block">
            Browse Preorders ✦
          </a>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              <strong style={{ color: 'var(--foreground)' }}>{books.length}</strong> {books.length === 1 ? 'title' : 'titles'} available
            </p>
          </div>
          <BookGrid books={books} />
        </>
      )}
    </div>
  );
}
