import React from 'react';
import Link from 'next/link';
import BookGrid from '@/components/books/BookGrid';
import { Book } from '@/lib/types';

interface Props {
  title: string;
  subtitle: string;
  books: Book[];
  viewAllHref: string;
}

export default function HomeFeaturedSection({ title, subtitle, books, viewAllHref }: Props) {
  return (
    <section className="content-wrapper mb-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {title}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
            {subtitle}
          </p>
        </div>
        <Link
          href={viewAllHref}
          className="text-sm font-medium flex items-center gap-1 transition-colors"
          style={{ color: 'var(--primary-bright)' }}
        >
          View all
          <span>→</span>
        </Link>
      </div>
      <BookGrid books={books} />
    </section>
  );
}