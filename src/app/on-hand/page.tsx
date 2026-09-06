'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StarField from '@/components/layout/StarField';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import SearchHintDropdown, { BOOK_SEARCH_HINTS } from '@/components/ui/SearchHintDropdown';
import { createClient } from '@/lib/supabase/client';

interface OnHandBook {
  id: string;
  sku: string;
  title: string;
  author: string;
  genre: string;
  cover_url: string;
  inventory: number;
  reserved: number;
  ordered: number;
  onhand_price: number | null;
  preorder_price: number;
  is_price_visible: boolean;
}

export default function OnHandPage() {
  const [items, setItems] = useState<OnHandBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('books')
        .select('id, sku, title, author, genre, cover_url, inventory, reserved, ordered, onhand_price, preorder_price, is_price_visible, arrival_date, visibility')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      // Filter to only On Hand books: arrival_date is null or in the past, not Reserved, and has available stock
      const today = new Date().toISOString().split('T')[0];
      const onHandBooks = (data ?? []).filter((row) => {
        if (row.visibility === 'Reserved') return false;
        if (row.arrival_date && row.arrival_date > today) return false;
        const available = (row.inventory ?? 0) - (row.reserved ?? 0) - (row.ordered ?? 0);
        return available > 0;
      }).map((row) => ({
        id: String(row.id ?? ''),
        sku: String(row.sku ?? ''),
        title: String(row.title ?? ''),
        author: String(row.author ?? ''),
        genre: String(row.genre ?? ''),
        cover_url: String(row.cover_url ?? ''),
        inventory: Number(row.inventory ?? 0),
        reserved: Number(row.reserved ?? 0),
        ordered: Number(row.ordered ?? 0),
        onhand_price: row.onhand_price != null ? Number(row.onhand_price) : null,
        preorder_price: Number(row.preorder_price ?? 0),
        is_price_visible: row.is_price_visible !== false,
      }));

      setItems(onHandBooks);
      const uniqueGenres = [...new Set(onHandBooks.map(i => i.genre).filter(Boolean))].sort();
      setGenres(uniqueGenres);
      setLoading(false);
    }
    load();
  }, []);

  const getDisplayPrice = (item: OnHandBook): number => {
    if (item.onhand_price != null && item.onhand_price > 0) return item.onhand_price;
    return item.preorder_price;
  };

  const getAvailable = (item: OnHandBook): number =>
    Math.max(0, item.inventory - item.reserved - item.ordered);

  const filtered = items.filter(item => {
    const matchSearch = !search.trim() || item.title.toLowerCase().includes(search.toLowerCase()) || item.author.toLowerCase().includes(search.toLowerCase());
    const matchGenre = !genreFilter || item.genre === genreFilter;
    return matchSearch && matchGenre;
  });

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <StarField />
      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar />
        <main className="pt-16">
          <div className="content-wrapper py-12">
            {/* Header */}
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
                ✦ Ready to Ship ✦
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                On Hand
              </h1>
              <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
                These titles are in stock and ready to ship. No waiting — grab them before they&apos;re gone!
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
                <input
                  type="search"
                  placeholder="Search titles or authors..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="input-field pl-9 text-sm w-full"
                />
                {searchFocused && <SearchHintDropdown hints={BOOK_SEARCH_HINTS} />}
              </div>
              {genres.length > 0 && (
                <select
                  value={genreFilter}
                  onChange={e => setGenreFilter(e.target.value)}
                  className="select-field text-sm py-2"
                  style={{ minWidth: '140px' }}
                >
                  <option value="">All Genres</option>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24">
                <Icon name="ArchiveBoxIcon" size={48} className="mx-auto mb-4" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
                <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--foreground-muted)' }}>
                  {search || genreFilter ? 'No titles match your search.' : 'No On-Hand Titles Right Now'}
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--foreground-subtle)' }}>
                  {search || genreFilter ? 'Try clearing your filters.' : 'Check back soon for available titles!'}
                </p>
                <Link href="/shop" className="btn-primary text-sm px-8 py-3 inline-block">
                  Browse Preorders ✦
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm mb-6 text-center" style={{ color: 'var(--foreground-muted)' }}>
                  <strong style={{ color: 'var(--foreground)' }}>{filtered.length}</strong> {filtered.length === 1 ? 'title' : 'titles'} available
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filtered.map(item => (
                    <Link
                      key={item.id}
                      href={`/book-detail?id=${item.id}`}
                      className="group block"
                    >
                      <div
                        className="rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-[1.02]"
                        style={{
                          background: 'var(--background-card)',
                          border: '1px solid var(--border)',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                        }}
                      >
                        <div className="relative aspect-[2/3]">
                          <AppImage
                            src={item.cover_url || '/assets/images/no_image.png'}
                            alt={`Cover of ${item.title} by ${item.author}`}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.9)', color: '#fff' }}>
                              On Hand
                            </span>
                          </div>
                          <div className="absolute top-2 right-2">
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                              {getAvailable(item)} left
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-bold truncate" style={{ color: 'var(--foreground)' }}>{item.title}</p>
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--foreground-muted)' }}>{item.author}</p>
                          {item.is_price_visible ? (
                            <p className="text-xs font-bold mt-1" style={{ color: 'var(--primary-bright)' }}>₱{getDisplayPrice(item).toLocaleString()}</p>
                          ) : (
                            <p className="text-xs font-medium mt-1" style={{ color: 'var(--foreground-subtle)' }}>Price TBA</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
