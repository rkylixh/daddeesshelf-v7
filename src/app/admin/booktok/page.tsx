'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '@/lib/supabase';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { Book } from '@/lib/types';

interface BooktokFavorite {
  id: string;
  book_id: string;
  sort_order: number;
  added_by: string;
  created_at: string;
  book?: Book;
}

function BooktokFavoritesContent() {
  const [favorites, setFavorites] = useState<BooktokFavorite[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addSearch, setAddSearch] = useState('');
  const [addResults, setAddResults] = useState<Book[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: favData } = await supabase
        .from('booktok_favorites')
        .select('*')
        .order('sort_order', { ascending: true });

      if (favData && favData.length > 0) {
        const bookIds = favData.map((f: Record<string, unknown>) => String(f.book_id));
        const { data: bookData } = await supabase
          .from('books')
          .select('*')
          .in('id', bookIds);

        const booksMap = new Map((bookData ?? []).map((b: Record<string, unknown>) => [String(b.id), b as unknown as Book]));
        setFavorites(favData.map((f: Record<string, unknown>) => ({
          ...(f as BooktokFavorite),
          book: booksMap.get(String(f.book_id)),
        })));
      } else {
        setFavorites([]);
      }

      const { data: books } = await supabase.from('books').select('*').eq('is_visible', true).order('title');
      setAllBooks((books ?? []) as unknown as Book[]);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddSearch = (q: string) => {
    setAddSearch(q);
    if (!q.trim()) { setAddResults([]); return; }
    const lower = q.toLowerCase();
    const results = allBooks
      .filter(b => !favorites.some(f => f.book_id === b.id))
      .filter(b =>
        b.title.toLowerCase().includes(lower) ||
        b.author.toLowerCase().includes(lower) ||
        b.sku.toLowerCase().includes(lower)
      )
      .slice(0, 8);
    setAddResults(results);
  };

  const handleAdd = async (book: Book) => {
    setSaving(true);
    setMessage('');
    try {
      const maxOrder = favorites.length > 0 ? Math.max(...favorites.map(f => f.sort_order)) + 1 : 0;
      const { error } = await supabase.from('booktok_favorites').insert({
        book_id: book.id,
        sort_order: maxOrder,
        added_by: 'admin',
      });
      if (error) throw error;
      setMessage(`"${book.title}" added to BookTok Favorites.`);
      setAddSearch('');
      setAddResults([]);
      await load();
    } catch {
      setMessage('Failed to add. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (favId: string, title: string) => {
    if (!confirm(`Remove "${title}" from BookTok Favorites?`)) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('booktok_favorites').delete().eq('id', favId);
      if (error) throw error;
      setMessage(`"${title}" removed.`);
      await load();
    } catch {
      setMessage('Failed to remove.');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveUp = async (idx: number) => {
    if (idx === 0) return;
    const updated = [...favorites];
    const temp = updated[idx].sort_order;
    updated[idx].sort_order = updated[idx - 1].sort_order;
    updated[idx - 1].sort_order = temp;
    setSaving(true);
    try {
      await Promise.all([
        supabase.from('booktok_favorites').update({ sort_order: updated[idx].sort_order }).eq('id', updated[idx].id),
        supabase.from('booktok_favorites').update({ sort_order: updated[idx - 1].sort_order }).eq('id', updated[idx - 1].id),
      ]);
      await load();
    } catch {
      setMessage('Failed to reorder.');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveDown = async (idx: number) => {
    if (idx === favorites.length - 1) return;
    const updated = [...favorites];
    const temp = updated[idx].sort_order;
    updated[idx].sort_order = updated[idx + 1].sort_order;
    updated[idx + 1].sort_order = temp;
    setSaving(true);
    try {
      await Promise.all([
        supabase.from('booktok_favorites').update({ sort_order: updated[idx].sort_order }).eq('id', updated[idx].id),
        supabase.from('booktok_favorites').update({ sort_order: updated[idx + 1].sort_order }).eq('id', updated[idx + 1].id),
      ]);
      await load();
    } catch {
      setMessage('Failed to reorder.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = favorites.filter(f => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      f.book?.title?.toLowerCase().includes(q) ||
      f.book?.author?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--foreground)' }}>BookTok Favorites</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
            Curated titles displayed on the homepage. Add, remove, and reorder.
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--primary-bright)', border: '1px solid rgba(139,92,246,0.3)' }}>
          {favorites.length} titles
        </span>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
          {message}
        </div>
      )}

      {/* Add a title */}
      <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--foreground)' }}>Add a Title</h3>
        <div className="relative">
          <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
          <input
            type="search"
            placeholder="Search by title, author, or SKU..."
            value={addSearch}
            onChange={e => handleAddSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
        {addResults.length > 0 && (
          <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
            {addResults.map(book => (
              <button
                key={book.id}
                onClick={() => handleAdd(book)}
                disabled={saving}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                style={{ borderBottom: '1px solid var(--border)', background: 'var(--background-card)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--background-card)')}
              >
                <div className="flex-shrink-0 w-8 h-11 rounded overflow-hidden" style={{ background: 'var(--muted)' }}>
                  <AppImage src={book.cover_url || '/assets/images/no_image.png'} alt={`Cover of ${book.title}`} width={32} height={44} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>{book.title}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>{book.author} · {book.sku}</p>
                </div>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--primary-bright)' }}>+ Add</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search existing */}
      <div className="relative mb-4">
        <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
        <input
          type="search"
          placeholder="Filter current favorites..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl mb-4 block">✦</span>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            {search ? 'No matching favorites.' : 'No BookTok Favorites yet. Add titles above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((fav, idx) => (
            <div
              key={fav.id}
              className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              <span className="text-xs font-bold w-6 text-center flex-shrink-0" style={{ color: 'var(--foreground-subtle)' }}>
                {idx + 1}
              </span>
              <div className="flex-shrink-0 w-10 h-14 rounded overflow-hidden" style={{ background: 'var(--muted)' }}>
                <AppImage
                  src={fav.book?.cover_url || '/assets/images/no_image.png'}
                  alt={`Cover of ${fav.book?.title ?? 'book'}`}
                  width={40}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{fav.book?.title ?? '—'}</p>
                <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>{fav.book?.author ?? '—'}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0 || saving}
                  className="w-7 h-7 rounded flex items-center justify-center"
                  style={{ background: 'var(--muted)', color: 'var(--foreground-muted)', opacity: idx === 0 ? 0.3 : 1 }}
                  aria-label="Move up"
                >
                  <Icon name="ChevronUpIcon" size={14} />
                </button>
                <button
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === filtered.length - 1 || saving}
                  className="w-7 h-7 rounded flex items-center justify-center"
                  style={{ background: 'var(--muted)', color: 'var(--foreground-muted)', opacity: idx === filtered.length - 1 ? 0.3 : 1 }}
                  aria-label="Move down"
                >
                  <Icon name="ChevronDownIcon" size={14} />
                </button>
                <button
                  onClick={() => handleRemove(fav.id, fav.book?.title ?? 'this title')}
                  disabled={saving}
                  className="w-7 h-7 rounded flex items-center justify-center ml-1"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                  aria-label="Remove"
                >
                  <Icon name="TrashIcon" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminBookTokPage() {
  return (
    <AdminGuard>
      <AdminLayout title="BookTok Favorites">
        <BooktokFavoritesContent />
      </AdminLayout>
    </AdminGuard>
  );
}
