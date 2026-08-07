'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StarField from '@/components/layout/StarField';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { OnHandItem } from '@/lib/types';

function mapOnHandRow(row: Record<string, unknown>): OnHandItem {
  return {
    id: String(row.id ?? ''),
    sku: String(row.sku ?? ''),
    title: String(row.title ?? ''),
    author: String(row.author ?? ''),
    genre: String(row.genre ?? ''),
    subgenre: String(row.subgenre ?? ''),
    series: String(row.series ?? ''),
    series_order: row.series_order != null ? Number(row.series_order) : null,
    format: (row.format as OnHandItem['format']) ?? 'Paperback',
    edition: String(row.edition ?? ''),
    final_srp: Number(row.final_srp ?? 0),
    inventory: Number(row.inventory ?? 0),
    synopsis: String(row.synopsis ?? ''),
    cover_url: String(row.cover_url ?? ''),
    goodreads_url: row.goodreads_url ? String(row.goodreads_url) : undefined,
    goodreads_score: row.goodreads_score != null ? Number(row.goodreads_score) : undefined,
    spice_level: row.spice_level != null ? Number(row.spice_level) : 0,
    gore_level: row.gore_level != null ? Number(row.gore_level) : 0,
    is_visible: row.is_visible !== false,
    is_price_visible: row.is_price_visible !== false,
    notes: String(row.notes ?? ''),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

export default function OnHandPage() {
  const [items, setItems] = useState<OnHandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('on_hand_items')
        .select('*')
        .eq('is_visible', true)
        .gt('inventory', 0)
        .order('created_at', { ascending: false });
      const mapped = (data ?? []).map(mapOnHandRow);
      setItems(mapped);
      const uniqueGenres = [...new Set(mapped.map(i => i.genre).filter(Boolean))].sort();
      setGenres(uniqueGenres);
      setLoading(false);
    }
    load();
  }, []);

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
                  className="input-field pl-9 text-sm w-full"
                />
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
                      href={`/book-detail?on_hand_id=${item.id}`}
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
                              {item.inventory} left
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-bold truncate" style={{ color: 'var(--foreground)' }}>{item.title}</p>
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--foreground-muted)' }}>{item.author}</p>
                          {item.is_price_visible ? (
                            <p className="text-xs font-bold mt-1" style={{ color: 'var(--primary-bright)' }}>₱{item.final_srp.toLocaleString()}</p>
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
