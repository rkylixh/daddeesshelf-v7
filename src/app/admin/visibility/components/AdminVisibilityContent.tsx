'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Icon from '@/components/ui/AppIcon';
import { Book } from '@/lib/types';
import { getAllBooksAdmin } from '@/lib/books';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import AppImage from '@/components/ui/AppImage';

export default function AdminVisibilityContent() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    const data = await getAllBooksAdmin();
    setBooks(data);
    // Expand all batches by default
    const batches = [...new Set(data.map(b => b.batch).filter(Boolean))];
    setExpandedBatches(new Set(batches));
    setLoading(false);
  };

  // Group books by batch
  const batchGroups = useMemo(() => {
    const filtered = search
      ? books.filter(b =>
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.author.toLowerCase().includes(search.toLowerCase()) ||
          b.sku.toLowerCase().includes(search.toLowerCase())
        )
      : books;

    const groups: Record<string, Book[]> = {};
    filtered.forEach(book => {
      const batch = book.batch || 'No Batch';
      if (!groups[batch]) groups[batch] = [];
      groups[batch].push(book);
    });

    // Sort batches
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [books, search]);

  const toggleBookVisibility = async (book: Book) => {
    const newVisible = !book.is_visible;
    setSaving(prev => new Set(prev).add(book.id));
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ is_visible: newVisible, updated_at: new Date().toISOString() })
        .eq('id', book.id);
      if (error) throw error;
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, is_visible: newVisible } : b));
      toast.success(`"${book.title}" is now ${newVisible ? 'visible' : 'hidden'} on the website`);
    } catch {
      toast.error('Failed to update visibility');
    } finally {
      setSaving(prev => { const next = new Set(prev); next.delete(book.id); return next; });
    }
  };

  const toggleBatchVisibility = async (batchName: string, batchBooks: Book[], makeVisible: boolean) => {
    const ids = batchBooks.map(b => b.id);
    setSaving(prev => { const next = new Set(prev); ids.forEach(id => next.add(id)); return next; });
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ is_visible: makeVisible, updated_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
      setBooks(prev => prev.map(b => ids.includes(b.id) ? { ...b, is_visible: makeVisible } : b));
      toast.success(`${batchName}: all ${ids.length} titles ${makeVisible ? 'shown' : 'hidden'} on website`);
    } catch {
      toast.error('Failed to update batch visibility');
    } finally {
      setSaving(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next; });
    }
  };

  const toggleBatchExpand = (batch: string) => {
    setExpandedBatches(prev => {
      const next = new Set(prev);
      next.has(batch) ? next.delete(batch) : next.add(batch);
      return next;
    });
  };

  const getBatchStats = (batchBooks: Book[]) => {
    const visible = batchBooks.filter(b => b.is_visible).length;
    const hidden = batchBooks.length - visible;
    return { visible, hidden, total: batchBooks.length };
  };

  const totalVisible = books.filter(b => b.is_visible).length;
  const totalHidden = books.filter(b => !b.is_visible).length;

  return (
    <AdminLayout title="Visibility Control">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl p-4" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <p className="text-2xl font-bold font-display tabular-nums" style={{ color: 'var(--primary-bright)' }}>{books.length}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>Total Titles</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <p className="text-2xl font-bold font-display tabular-nums" style={{ color: '#4ade80' }}>{totalVisible}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>Visible on Site</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <p className="text-2xl font-bold font-display tabular-nums" style={{ color: '#f87171' }}>{totalHidden}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>Hidden from Site</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Icon
          name="MagnifyingGlassIcon"
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties}
        />
        <input
          type="search"
          placeholder="Search titles, authors, SKUs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-9 py-2 text-sm w-full"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : batchGroups.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--foreground-muted)' }}>
          <p className="text-sm">No titles found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batchGroups.map(([batchName, batchBooks]) => {
            const stats = getBatchStats(batchBooks);
            const isExpanded = expandedBatches.has(batchName);
            const allVisible = stats.visible === stats.total;
            const allHidden = stats.hidden === stats.total;
            const anyBatchSaving = batchBooks.some(b => saving.has(b.id));

            return (
              <div
                key={batchName}
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
              >
                {/* Batch header */}
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleBatchExpand(batchName)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <Icon
                      name={isExpanded ? 'ChevronDownIcon' : 'ChevronRightIcon'}
                      size={16}
                      style={{ color: 'var(--foreground-subtle)', flexShrink: 0 } as React.CSSProperties}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{batchName}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>
                        {stats.total} title{stats.total !== 1 ? 's' : ''} &middot;{' '}
                        <span style={{ color: '#4ade80' }}>{stats.visible} visible</span>
                        {stats.hidden > 0 && (
                          <span style={{ color: '#f87171' }}> &middot; {stats.hidden} hidden</span>
                        )}
                      </p>
                    </div>
                  </button>

                  {/* Batch-level controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!allVisible && (
                      <button
                        onClick={() => toggleBatchVisibility(batchName, batchBooks, true)}
                        disabled={anyBatchSaving}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                        style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}
                      >
                        Show All
                      </button>
                    )}
                    {!allHidden && (
                      <button
                        onClick={() => toggleBatchVisibility(batchName, batchBooks, false)}
                        disabled={anyBatchSaving}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                        style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
                      >
                        Hide All
                      </button>
                    )}
                  </div>
                </div>

                {/* Book list */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {batchBooks.map((book, idx) => {
                      const isSaving = saving.has(book.id);
                      return (
                        <div
                          key={book.id}
                          className="flex items-center gap-3 px-4 py-3 transition-all"
                          style={{
                            borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                            background: book.is_visible ? undefined : 'rgba(248,113,113,0.04)',
                          }}
                        >
                          {/* Cover */}
                          <div
                            className="flex-shrink-0 w-9 h-12 rounded overflow-hidden"
                            style={{ background: 'rgba(200,164,91,0.1)', border: '1px solid var(--border)' }}
                          >
                            {book.cover_url ? (
                              <AppImage
                                src={book.cover_url}
                                alt={`Cover of ${book.title}`}
                                width={36}
                                height={48}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon name="BookOpenIcon" size={14} style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: book.is_visible ? 'var(--foreground)' : 'var(--foreground-muted)' }}
                            >
                              {book.title}
                            </p>
                            <p className="text-xs truncate" style={{ color: 'var(--foreground-subtle)' }}>
                              {book.author} &middot; {book.sku}
                            </p>
                          </div>

                          {/* Visibility badge */}
                          <div
                            className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                            style={book.is_visible
                              ? { background: 'rgba(74,222,128,0.12)', color: '#4ade80' }
                              : { background: 'rgba(248,113,113,0.12)', color: '#f87171' }
                            }
                          >
                            {book.is_visible ? 'Visible' : 'Hidden'}
                          </div>

                          {/* Toggle */}
                          <button
                            onClick={() => toggleBookVisibility(book)}
                            disabled={isSaving}
                            className="flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-50"
                            style={{
                              background: book.is_visible ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                            }}
                            aria-label={book.is_visible ? `Hide ${book.title}` : `Show ${book.title}`}
                          >
                            {isSaving ? (
                              <span
                                className="absolute inset-0 flex items-center justify-center"
                              >
                                <span
                                  className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                                  style={{ borderColor: 'rgba(255,255,255,0.6)' }}
                                />
                              </span>
                            ) : (
                              <span
                                className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                                style={{ transform: book.is_visible ? 'translateX(24px)' : 'translateX(4px)' }}
                              />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
