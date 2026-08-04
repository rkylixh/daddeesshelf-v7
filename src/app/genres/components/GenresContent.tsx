'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBooks } from '@/lib/books';
import { Book } from '@/lib/types';

const GENRE_ICONS: Record<string, string> = {
  'Fantasy': '🧙',
  'Romance': '💕',
  'Thriller': '🔪',
  'Mystery': '🔍',
  'Horror': '👻',
  'Literary Fiction': '📖',
  'Historical Fiction': '🏛️',
  'Science Fiction': '🚀',
  'Classics': '📜',
  'Fiction': '📚',
  'Mythology': '⚡',
  'Nonfiction': '🎓',
  'Business': '💼',
  'Religion': '✝️',
};

export default function GenresContent() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBooks().then(data => { setBooks(data); setLoading(false); });
  }, []);

  const genreMap = books.reduce<Record<string, number>>((acc, b) => {
    acc[b.genre] = (acc[b.genre] ?? 0) + 1;
    return acc;
  }, {});

  const genres = Object.entries(genreMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="content-wrapper py-12">
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Browse by Genre ✦
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Genres
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          Explore our curated collection by genre. From epic fantasy to cozy mysteries — there&apos;s something for every reader.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {genres.map(([genre, count]) => (
            <Link
              key={genre}
              href={`/shop?genre=${encodeURIComponent(genre)}`}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl text-center transition-all duration-300 card-glow"
              style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              <span className="text-3xl" aria-hidden="true">{GENRE_ICONS[genre] ?? '📚'}</span>
              <div>
                <p className="font-display text-sm font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>{genre}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>{count} title{count !== 1 ? 's' : ''}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
