'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
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

// Predefined subgenres per genre
const GENRE_SUBGENRES: Record<string, string[]> = {
  'Fantasy': ['Romantasy', 'Epic Fantasy', 'Dark Fantasy', 'Urban Fantasy', 'Cozy Fantasy', 'Historical Fantasy', 'High Fantasy', 'Fae Fantasy'],
  'Romance': ['Contemporary Romance', 'Historical Romance', 'Paranormal Romance', 'Dark Romance', 'Sports Romance', 'Small Town Romance'],
  'Thriller': ['Psychological Thriller', 'Crime Thriller', 'Legal Thriller', 'Political Thriller', 'Domestic Thriller'],
  'Mystery': ['Cozy Mystery', 'Detective Mystery', 'Crime Mystery', 'Paranormal Mystery'],
  'Horror': ['Gothic Horror', 'Psychological Horror', 'Supernatural Horror', 'Dark Fantasy'],
  'Science Fiction': ['Space Opera', 'Dystopian', 'Cyberpunk', 'Hard Sci-Fi', 'Time Travel'],
  'Historical Fiction': ['Medieval', 'Victorian', 'World War', 'Ancient World', 'Renaissance'],
  'Literary Fiction': ['Contemporary', 'Coming of Age', 'Family Saga', 'Magical Realism'],
};

interface SubgenreCard {
  name: string;
  count: number;
  coverUrl: string | null;
  coverAlt: string;
}

interface GenreDetailViewProps {
  genre: string;
  books: Book[];
  onBack: () => void;
}

function GenreDetailView({ genre, books, onBack }: GenreDetailViewProps) {
  const router = useRouter();

  // Build subgenre cards from actual book data + predefined list
  const subgenreMap = books.reduce<Record<string, { count: number; coverUrl: string | null; coverAlt: string }>>((acc, b) => {
    if (!b.subgenre) return acc;
    if (!acc[b.subgenre]) {
      acc[b.subgenre] = { count: 0, coverUrl: b.cover_url || null, coverAlt: `${b.title} cover` };
    }
    acc[b.subgenre].count += 1;
    return acc;
  }, {});

  // Also include predefined subgenres with 0 count if not in data
  const predefined = GENRE_SUBGENRES[genre] ?? [];
  predefined.forEach(sg => {
    if (!subgenreMap[sg]) {
      subgenreMap[sg] = { count: 0, coverUrl: null, coverAlt: `${sg} books` };
    }
  });

  const subgenres: SubgenreCard[] = Object.entries(subgenreMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);

  const handleSubgenreClick = (subgenre: string) => {
    router.push(`/shop?genre=${encodeURIComponent(genre)}&subgenre=${encodeURIComponent(subgenre)}`);
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm mb-8 transition-colors"
        style={{ color: 'var(--foreground-muted)' }}
      >
        ← Back to All Genres
      </button>

      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Browse by Subgenre ✦
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          <span className="mr-3" aria-hidden="true">{GENRE_ICONS[genre] ?? '📚'}</span>
          {genre}
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          Explore {genre} by subgenre. Select a subgenre to browse matching titles.
        </p>
      </div>

      {subgenres.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-4xl mb-4 block">✦</span>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No subgenres found for {genre} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {subgenres.map(sg => (
            <button
              key={sg.name}
              onClick={() => handleSubgenreClick(sg.name)}
              className="group flex flex-col rounded-2xl overflow-hidden text-left transition-all duration-300 card-glow"
              style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              {/* Representative cover or placeholder */}
              <div className="relative w-full aspect-[3/2] overflow-hidden">
                {sg.coverUrl ? (
                  <AppImage
                    src={sg.coverUrl}
                    alt={sg.coverAlt}
                    fill
                    sizes="200px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-3xl"
                    style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(79,70,229,0.1))' }}
                    aria-hidden="true"
                  >
                    {GENRE_ICONS[genre] ?? '📚'}
                  </div>
                )}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }}
                  aria-hidden="true"
                />
              </div>
              <div className="p-3">
                <p className="font-display text-sm font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
                  {sg.name}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                  {sg.count > 0 ? `${sg.count} title${sg.count !== 1 ? 's' : ''}` : 'Coming soon'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* View all in genre button */}
      <div className="text-center mt-10">
        <button
          onClick={() => router.push(`/shop?genre=${encodeURIComponent(genre)}`)}
          className="btn-secondary text-sm px-8 py-3"
        >
          View All {genre} Books →
        </button>
      </div>
    </div>
  );
}

export default function GenresContent() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  useEffect(() => {
    getBooks().then(data => { setBooks(data); setLoading(false); });
  }, []);

  const genreMap = books.reduce<Record<string, { count: number; coverUrl: string | null; coverAlt: string }>>((acc, b) => {
    if (!acc[b.genre]) {
      acc[b.genre] = { count: 0, coverUrl: b.cover_url || null, coverAlt: `${b.title} cover` };
    }
    acc[b.genre].count += 1;
    return acc;
  }, {});

  const genres = Object.entries(genreMap).sort((a, b) => b[1].count - a[1].count);

  const selectedBooks = selectedGenre ? books.filter(b => b.genre === selectedGenre) : [];

  return (
    <div className="content-wrapper py-12">
      {selectedGenre ? (
        <GenreDetailView
          genre={selectedGenre}
          books={selectedBooks}
          onBack={() => setSelectedGenre(null)}
        />
      ) : (
        <>
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
              {genres.map(([genre, data]) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl text-center transition-all duration-300 card-glow"
                  style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
                >
                  <span className="text-3xl" aria-hidden="true">{GENRE_ICONS[genre] ?? '📚'}</span>
                  <div>
                    <p className="font-display text-sm font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>{genre}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>{data.count} title{data.count !== 1 ? 's' : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
