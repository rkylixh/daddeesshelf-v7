'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Icon from '@/components/ui/AppIcon';
import { Book } from '@/lib/types';
import { getAllBooksAdmin } from '@/lib/books';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import AppImage from '@/components/ui/AppImage';
import { logAudit } from '@/lib/auditLog';

type VisibilityField = 'is_visible' | 'is_price_visible' | 'is_eta_visible';

const TOGGLE_CONFIG: { field: VisibilityField; label: string; shortLabel: string; color: string; bg: string; border: string }[] = [
  {
    field: 'is_visible',
    label: 'Visible',
    shortLabel: 'Visible',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.12)',
    border: 'rgba(74,222,128,0.3)',
  },
  {
    field: 'is_price_visible',
    label: 'Price Visible',
    shortLabel: 'Price',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.3)',
  },
  {
    field: 'is_eta_visible',
    label: 'ETA Visible',
    shortLabel: 'ETA',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
  },
];

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
    const batches = [...new Set(data.map(b => b.batch).filter(Boolean))];
    setExpandedBatches(new Set(batches));
    setLoading(false);
  };

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

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [books, search]);

  const toggleBookField = async (book: Book, field: VisibilityField) => {
    const newValue = !book[field];
    const saveKey = `${book.id}-${field}`;
    setSaving(prev => new Set(prev).add(saveKey));
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ [field]: newValue, updated_at: new Date().toISOString() })
        .eq('id', book.id);
      if (error) throw error;
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, [field]: newValue } : b));
      const cfg = TOGGLE_CONFIG.find(c => c.field === field)!;
      toast.success(`"${book.title}" — ${cfg.label} ${newValue ? 'on' : 'off'}`);
      await logAudit({
        action: 'BOOK_VISIBILITY_TOGGLED',
        module: 'Visibility Control',
        target_ref: book.title,
        prev_value: `${cfg.label}: ${!newValue ? 'on' : 'off'}`,
        new_value: `${cfg.label}: ${newValue ? 'on' : 'off'}`,
        explanation: `Admin toggled ${cfg.label} for "${book.title}" (SKU: ${book.sku}) — now ${newValue ? 'visible' : 'hidden'}`,
      });
    } catch {
      toast.error('Failed to update visibility');
    } finally {
      setSaving(prev => { const next = new Set(prev); next.delete(saveKey); return next; });
    }
  };

  const toggleBatchField = async (batchName: string, batchBooks: Book[], field: VisibilityField, makeVisible: boolean) => {
    const ids = batchBooks.map(b => b.id);
    const saveKeys = ids.map(id => `${id}-${field}`);
    setSaving(prev => { const next = new Set(prev); saveKeys.forEach(k => next.add(k)); return next; });
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ [field]: makeVisible, updated_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
      setBooks(prev => prev.map(b => ids.includes(b.id) ? { ...b, [field]: makeVisible } : b));
      const cfg = TOGGLE_CONFIG.find(c => c.field === field)!;
      toast.success(`${batchName}: ${cfg.label} ${makeVisible ? 'on' : 'off'} for all ${ids.length} titles`);
      await logAudit({
        action: 'BATCH_VISIBILITY_TOGGLED',
        module: 'Visibility Control',
        target_ref: batchName,
        prev_value: `${cfg.label}: ${!makeVisible ? 'on' : 'off'}`,
        new_value: `${cfg.label}: ${makeVisible ? 'on' : 'off'}`,
        explanation: `Admin set ${cfg.label} to ${makeVisible ? 'on' : 'off'} for all ${ids.length} titles in "${batchName}"`,
      });
    } catch {
      toast.error('Failed to update batch visibility');
    } finally {
      setSaving(prev => { const next = new Set(prev); saveKeys.forEach(k => next.delete(k)); return next; });
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
    return {
      total: batchBooks.length,
      visible: batchBooks.filter(b => b.is_visible).length,
      priceVisible: batchBooks.filter(b => b.is_price_visible).length,
      etaVisible: batchBooks.filter(b => b.is_eta_visible).length,
    };
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

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {TOGGLE_CONFIG.map(cfg => (
          <div key={cfg.field} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
            <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>{cfg.label}</span>
          </div>
        ))}
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
            const anyBatchSaving = batchBooks.some(b =>
              TOGGLE_CONFIG.some(cfg => saving.has(`${b.id}-${cfg.field}`))
            );

            return (
              <div
                key={batchName}
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
              >
                {/* Batch header */}
                <div className="flex items-start gap-3 p-4">
                  <button
                    onClick={() => toggleBatchExpand(batchName)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <Icon
                      name={isExpanded ? 'ChevronDownIcon' : 'ChevronRightIcon'}
                      size={16}
                      style={{ color: 'var(--foreground-subtle)', flexShrink: 0, marginTop: 2 } as React.CSSProperties}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{batchName}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>
                        {stats.total} title{stats.total !== 1 ? 's' : ''} &middot;{' '}
                        <span style={{ color: '#4ade80' }}>{stats.visible} visible</span>
                        {stats.total - stats.visible > 0 && (
                          <span style={{ color: '#f87171' }}> &middot; {stats.total - stats.visible} hidden</span>
                        )}
                      </p>
                    </div>
                  </button>

                  {/* Batch-level controls — one row per toggle type */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {TOGGLE_CONFIG.map(cfg => {
                      const onCount = batchBooks.filter(b => b[cfg.field]).length;
                      const allOn = onCount === stats.total;
                      const allOff = onCount === 0;
                      return (
                        <div key={cfg.field} className="flex items-center gap-1.5">
                          <span className="text-xs w-14 text-right" style={{ color: 'var(--foreground-subtle)' }}>{cfg.shortLabel}</span>
                          {!allOn && (
                            <button
                              onClick={() => toggleBatchField(batchName, batchBooks, cfg.field, true)}
                              disabled={anyBatchSaving}
                              className="text-xs px-2 py-1 rounded-lg font-medium transition-all disabled:opacity-50"
                              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                            >
                              Show All
                            </button>
                          )}
                          {!allOff && (
                            <button
                              onClick={() => toggleBatchField(batchName, batchBooks, cfg.field, false)}
                              disabled={anyBatchSaving}
                              className="text-xs px-2 py-1 rounded-lg font-medium transition-all disabled:opacity-50"
                              style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
                            >
                              Hide All
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Book list */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {batchBooks.map((book, idx) => {
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

                          {/* Three toggles */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {TOGGLE_CONFIG.map(cfg => {
                              const isOn = !!book[cfg.field];
                              const saveKey = `${book.id}-${cfg.field}`;
                              const isSaving = saving.has(saveKey);
                              return (
                                <div key={cfg.field} className="flex flex-col items-center gap-1">
                                  <span className="text-xs" style={{ color: 'var(--foreground-subtle)', fontSize: '10px' }}>{cfg.shortLabel}</span>
                                  <button
                                    onClick={() => toggleBookField(book, cfg.field)}
                                    disabled={isSaving}
                                    className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 disabled:opacity-50"
                                    style={{
                                      background: isOn ? cfg.color : 'rgba(255,255,255,0.15)',
                                    }}
                                    aria-label={`${cfg.label}: ${isOn ? 'on' : 'off'} for ${book.title}`}
                                  >
                                    {isSaving ? (
                                      <span className="absolute inset-0 flex items-center justify-center">
                                        <span
                                          className="w-2.5 h-2.5 rounded-full border border-t-transparent animate-spin"
                                          style={{ borderColor: 'rgba(255,255,255,0.6)' }}
                                        />
                                      </span>
                                    ) : (
                                      <span
                                        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
                                        style={{ transform: isOn ? 'translateX(18px)' : 'translateX(3px)' }}
                                      />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
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
