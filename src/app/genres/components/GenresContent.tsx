'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { getBooks } from '@/lib/books';
import { Book } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import AppImage from '@/components/ui/AppImage';

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

const SUBGENRE_ICONS: Record<string, string> = {
  'Romantasy': '🌹',
  'Epic Fantasy': '⚔️',
  'Dark Fantasy': '🌑',
  'Urban Fantasy': '🏙️',
  'Cozy Fantasy': '🍵',
  'Historical Fantasy': '🗡️',
  'High Fantasy': '🏰',
  'Fae Fantasy': '🧚',
  'Contemporary Romance': '💌',
  'Historical Romance': '🕯️',
  'Paranormal Romance': '🌙',
  'Dark Romance': '🖤',
  'Sports Romance': '🏆',
  'Small Town Romance': '🌻',
  'Psychological Thriller': '🧠',
  'Crime Thriller': '🔫',
  'Legal Thriller': '⚖️',
  'Political Thriller': '🏛️',
  'Domestic Thriller': '🏠',
  'Cozy Mystery': '☕',
  'Detective Mystery': '🕵️',
  'Crime Mystery': '🔎',
  'Paranormal Mystery': '👁️',
  'Gothic Horror': '🦇',
  'Psychological Horror': '😱',
  'Supernatural Horror': '👁️',
  'Space Opera': '🌌',
  'Dystopian': '🏚️',
  'Cyberpunk': '🤖',
  'Hard Sci-Fi': '🔬',
  'Time Travel': '⏳',
  'Medieval': '🛡️',
  'Victorian': '🎩',
  'World War': '🎖️',
  'Ancient World': '🏺',
  'Renaissance': '🎨',
  'Contemporary': '🌆',
  'Coming of Age': '🌱',
  'Family Saga': '🏡',
  'Magical Realism': '✨',
};

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

interface GenreImageMap {
  [key: string]: string; // key: "genre" or "genre|||subgenre"
}

interface SubgenreCard {
  name: string;
  count: number;
}

interface GenreDetailViewProps {
  genre: string;
  books: Book[];
  imageMap: GenreImageMap;
  onBack: () => void;
}

function GenreDetailView({ genre, books, imageMap, onBack }: GenreDetailViewProps) {
  const router = useRouter();

  const subgenreMap = books.reduce<Record<string, number>>((acc, b) => {
    if (!b.subgenre) return acc;
    acc[b.subgenre] = (acc[b.subgenre] ?? 0) + 1;
    return acc;
  }, {});

  const predefined = GENRE_SUBGENRES[genre] ?? [];
  predefined.forEach(sg => {
    if (!(sg in subgenreMap)) subgenreMap[sg] = 0;
  });

  const subgenres: SubgenreCard[] = Object.entries(subgenreMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const handleSubgenreClick = (subgenre: string) => {
    router.push(`/shop?genre=${encodeURIComponent(genre)}&subgenre=${encodeURIComponent(subgenre)}`);
  };

  const getSubgenreImage = (sg: string) => imageMap[`${genre}|||${sg}`] ?? '';

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
          {!imageMap[genre] && (
            <span className="mr-3" aria-hidden="true">{GENRE_ICONS[genre] ?? '📚'}</span>
          )}
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {subgenres.map(sg => {
            const sgImg = getSubgenreImage(sg.name);
            return (
              <button
                key={sg.name}
                onClick={() => handleSubgenreClick(sg.name)}
                className="group flex flex-col rounded-xl text-center transition-all duration-300 overflow-hidden"
                style={{
                  background: 'rgba(251,245,236,0.55)',
                  border: '1.5px solid rgba(200,164,91,0.55)',
                  boxShadow: '0 2px 10px rgba(75,53,42,0.10), 0 1px 3px rgba(75,53,42,0.06)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                {/* Image / icon area */}
                <div
                  className="relative w-full overflow-hidden flex items-center justify-center"
                  style={{ aspectRatio: '3/2', background: 'rgba(200,180,150,0.18)' }}
                >
                  {sgImg ? (
                    <AppImage
                      src={sgImg}
                      alt={`${sg.name} subgenre`}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 15vw"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span
                      className="text-3xl leading-none"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.4))' }}
                      aria-hidden="true"
                    >
                      {SUBGENRE_ICONS[sg.name] ?? GENRE_ICONS[genre] ?? '📚'}
                    </span>
                  )}
                </div>
                {/* Label area */}
                <div className="px-2 py-2">
                  <p className="font-display text-xs font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
                    {sg.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-subtle)', fontSize: '0.65rem' }}>
                    {sg.count > 0 ? `${sg.count} title${sg.count !== 1 ? 's' : ''}` : 'Coming soon'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

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
  const searchParams = useSearchParams();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(searchParams.get('genre'));
  const [imageMap, setImageMap] = useState<GenreImageMap>({});

  useEffect(() => {
    Promise.all([
      getBooks(),
      supabase.from('genre_images').select('genre, subgenre, image_url'),
    ]).then(([booksData, imgResponse]) => {
      const imgData = imgResponse.data;
      setBooks(booksData);
      if (imgData) {
        const map: GenreImageMap = {};
        (imgData as { genre: string; subgenre: string | null; image_url: string }[]).forEach(row => {
          const key = row.subgenre ? `${row.genre}|||${row.subgenre}` : row.genre;
          if (row.image_url) map[key] = row.image_url;
        });
        setImageMap(map);
      }
      setLoading(false);
    });
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
          imageMap={imageMap}
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
              {genres.map(([genre, data]) => {
                const genreImg = imageMap[genre];
                return (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className="group flex flex-col rounded-2xl text-center transition-all duration-300 overflow-hidden"
                    style={{
                      background: 'rgba(251,245,236,0.55)',
                      border: '1.5px solid rgba(200,164,91,0.55)',
                      boxShadow: '0 2px 10px rgba(75,53,42,0.10), 0 1px 3px rgba(75,53,42,0.06)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                    }}
                  >
                    {/* Image / icon area */}
                    <div
                      className="relative w-full overflow-hidden flex items-center justify-center"
                      style={{ aspectRatio: '3/2', background: 'rgba(200,180,150,0.18)' }}
                    >
                      {genreImg ? (
                        <AppImage
                          src={genreImg}
                          alt={`${genre} genre`}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span
                          className="text-5xl leading-none"
                          style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.35))' }}
                          aria-hidden="true"
                        >
                          {GENRE_ICONS[genre] ?? '📚'}
                        </span>
                      )}
                    </div>
                    {/* Label area */}
                    <div className="px-3 py-3">
                      <p className="font-display text-sm font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>{genre}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>{data.count} title{data.count !== 1 ? 's' : ''}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
