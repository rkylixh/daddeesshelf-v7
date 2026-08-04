import React from 'react';
import BookCard from './BookCard';
import { Book } from '@/lib/types';

interface BookGridProps {
  books: Book[];
  loading?: boolean;
  emptyMessage?: string;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
      <div className="skeleton aspect-[2/3]" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="flex justify-between mt-2">
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export default function BookGrid({ books, loading = false, emptyMessage }: BookGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }, (_, i) => (
          <SkeletonCard key={`skeleton-${i + 1}`} />
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 rounded-xl"
        style={{ border: '1px dashed var(--border)', background: 'var(--background-card)' }}
      >
        <span className="text-4xl mb-4">✦</span>
        <h3 className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>
          No books found
        </h3>
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--foreground-subtle)' }}>
          {emptyMessage || 'Try adjusting your search or filters to find what you\'re looking for.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {books.map(book => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}