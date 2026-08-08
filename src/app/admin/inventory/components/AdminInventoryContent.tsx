'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Icon from '@/components/ui/AppIcon';
import { Book } from '@/lib/types';
import { getAllBooksAdmin, createBook, updateBook, deleteBook, bulkUpdateBooks } from '@/lib/books';
import { toast } from 'sonner';
import BookFormModal from '@/app/inventory-control/components/BookFormModal';
import DeleteConfirmModal from '@/app/inventory-control/components/DeleteConfirmModal';
import BulkActionsBar from '@/app/inventory-control/components/BulkActionsBar';
import InventoryTable from '@/app/inventory-control/components/InventoryTable';
import { supabase } from '@/lib/supabase';
import AppImage from '@/components/ui/AppImage';
import { logAudit } from '@/lib/auditLog';

export type ModalMode = 'add' | 'edit' | 'duplicate' | null;

const GENRES = ['Fantasy', 'Romance', 'Thriller', 'Mystery', 'Horror', 'Literary Fiction', 'Historical Fiction', 'Science Fiction', 'Classics', 'Fiction', 'Mythology', 'Nonfiction', 'Business', 'Religion'];
const FORMATS = ['Paperback', 'Hardcover', 'Special Edition', 'Omnibus', 'Bundle'];
const BATCHES = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4', 'Batch 5'];
const STATUSES = ['Pre-order', 'On Hand', 'Sold Out'];

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

interface GenreImage {
  id: string;
  genre: string;
  subgenre: string | null;
  image_url: string;
}

// ── Genre Edits Tab ──────────────────────────────────────
function GenreEditsTab() {
  const [genreImages, setGenreImages] = useState<GenreImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedGenre, setExpandedGenre] = useState<string | null>(null);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});

  const makeKey = (genre: string, subgenre?: string | null) =>
    subgenre ? `${genre}|||${subgenre}` : genre;

  useEffect(() => {
    loadGenreImages();
  }, []);

  const loadGenreImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('genre_images')
      .select('*');
    if (!error && data) {
      setGenreImages(data as GenreImage[]);
      const inputs: Record<string, string> = {};
      (data as GenreImage[]).forEach(row => {
        inputs[makeKey(row.genre, row.subgenre)] = row.image_url;
      });
      setUrlInputs(inputs);
    }
    setLoading(false);
  };

  const handleSave = async (genre: string, subgenre?: string | null) => {
    const key = makeKey(genre, subgenre);
    const url = urlInputs[key] ?? '';
    setSaving(key);
    try {
      const { error } = await supabase
        .from('genre_images')
        .upsert(
          { genre, subgenre: subgenre ?? null, image_url: url, updated_at: new Date().toISOString() },
          { onConflict: 'genre,subgenre' }
        );
      if (error) throw error;
      toast.success(`Image saved for ${subgenre ?? genre}`);
      await logAudit({
        action: 'GENRE_IMAGE_UPDATED',
        module: 'Inventory',
        target_ref: subgenre ? `${genre} > ${subgenre}` : genre,
        prev_value: genreImages.find(r => r.genre === genre && r.subgenre === (subgenre ?? null))?.image_url ?? '',
        new_value: url,
        explanation: `Admin updated genre image for "${subgenre ?? genre}"`,
      });
      await loadGenreImages();
    } catch {
      toast.error('Failed to save image URL');
    } finally {
      setSaving(null);
    }
  };

  const getUrl = (genre: string, subgenre?: string | null) =>
    urlInputs[makeKey(genre, subgenre)] ?? '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>Genre &amp; Subgenre Images</h2>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          Paste an image URL for each genre or subgenre card. The photo will replace the emoji/icon on the storefront.
        </p>
      </div>

      <div className="space-y-3">
        {GENRES.map(genre => {
          const subgenres = GENRE_SUBGENRES[genre] ?? [];
          const isExpanded = expandedGenre === genre;
          const genreUrl = getUrl(genre);

          return (
            <div
              key={genre}
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              {/* Genre row */}
              <div className="flex items-center gap-3 p-4">
                {/* Preview */}
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center"
                  style={{ background: 'rgba(200,164,91,0.12)', border: '1px solid rgba(200,164,91,0.3)' }}
                >
                  {genreUrl ? (
                    <AppImage
                      src={genreUrl}
                      alt={`${genre} genre image`}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Icon name="PhotoIcon" size={20} style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--foreground)' }}>{genre}</p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste image URL..."
                      value={getUrl(genre)}
                      onChange={e => setUrlInputs(prev => ({ ...prev, [makeKey(genre)]: e.target.value }))}
                      className="input-field text-xs py-1.5 flex-1"
                    />
                    <button
                      onClick={() => handleSave(genre, null)}
                      disabled={saving === makeKey(genre)}
                      className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
                    >
                      {saving === makeKey(genre) ? '...' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Expand subgenres */}
                {subgenres.length > 0 && (
                  <button
                    onClick={() => setExpandedGenre(isExpanded ? null : genre)}
                    className="flex-shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(200,164,91,0.1)', color: 'var(--primary-bright)', border: '1px solid rgba(200,164,91,0.3)' }}
                  >
                    <span>{subgenres.length} subgenres</span>
                    <Icon name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={12} />
                  </button>
                )}
              </div>

              {/* Subgenres */}
              {isExpanded && subgenres.length > 0 && (
                <div
                  className="border-t px-4 pb-4 pt-3 space-y-2"
                  style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.03)' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--foreground-subtle)' }}>
                    Subgenres of {genre}
                  </p>
                  {subgenres.map(sg => {
                    const sgUrl = getUrl(genre, sg);
                    const sgKey = makeKey(genre, sg);
                    return (
                      <div key={sg} className="flex items-center gap-3">
                        {/* Preview */}
                        <div
                          className="flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center"
                          style={{ background: 'rgba(200,164,91,0.08)', border: '1px solid rgba(200,164,91,0.2)' }}
                        >
                          {sgUrl ? (
                            <AppImage
                              src={sgUrl}
                              alt={`${sg} subgenre image`}
                              width={36}
                              height={36}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Icon name="PhotoIcon" size={14} style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
                          )}
                        </div>
                        <p className="text-xs w-36 flex-shrink-0" style={{ color: 'var(--foreground-muted)' }}>{sg}</p>
                        <input
                          type="url"
                          placeholder="Paste image URL..."
                          value={sgUrl}
                          onChange={e => setUrlInputs(prev => ({ ...prev, [sgKey]: e.target.value }))}
                          className="input-field text-xs py-1.5 flex-1"
                        />
                        <button
                          onClick={() => handleSave(genre, sg)}
                          disabled={saving === sgKey}
                          className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
                        >
                          {saving === sgKey ? '...' : 'Save'}
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
    </div>
  );
}

// ── Main Component ───────────────────────────────────────
export default function AdminInventoryContent() {
  const [activeTab, setActiveTab] = useState<'books' | 'genre-edits'>('books');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterFormat, setFilterFormat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [sortCol, setSortCol] = useState<keyof Book>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    const data = await getAllBooksAdmin();
    setBooks(data);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let result = [...books];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.sku.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q) ||
        b.subgenre.toLowerCase().includes(q)
      );
    }
    if (filterGenre) result = result.filter(b => b.genre === filterGenre);
    if (filterFormat) result = result.filter(b => b.format === filterFormat);
    if (filterStatus) result = result.filter(b => b.status === filterStatus);
    if (filterBatch) result = result.filter(b => b.batch === filterBatch);
    result.sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [books, search, filterGenre, filterFormat, filterStatus, filterBatch, sortCol, sortDir]);

  const handleSort = (col: keyof Book) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filtered.map(b => b.id)) : new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const openAdd = () => { setEditingBook(null); setModalMode('add'); };
  const openEdit = (book: Book) => { setEditingBook(book); setModalMode('edit'); };
  const openDuplicate = (book: Book) => {
    setEditingBook({ ...book, id: '', sku: `${book.sku}-COPY`, title: `${book.title} (Copy)` });
    setModalMode('duplicate');
  };
  const openDelete = (book: Book) => setDeleteTarget(book);

  const handleSave = useCallback(async (data: Omit<Book, 'id' | 'created_at' | 'updated_at'>) => {
    if (modalMode === 'edit' && editingBook) {
      const updated = await updateBook(editingBook.id, data);
      if (updated) {
        setBooks(prev => prev.map(b => b.id === editingBook.id ? updated : b));
        toast.success(`"${data.title}" updated`);
        await logAudit({
          action: 'BOOK_UPDATED',
          module: 'Inventory',
          target_ref: data.title,
          prev_value: editingBook.title,
          new_value: data.title,
          explanation: `Admin updated book "${data.title}" (SKU: ${data.sku}) in inventory`,
        });
      } else {
        toast.error('Update failed');
      }
    } else {
      const created = await createBook(data as Omit<Book, 'id' | 'created_at' | 'updated_at' | 'available' | 'status'>);
      if (created) {
        setBooks(prev => [created, ...prev]);
        toast.success(`"${data.title}" added to inventory`);
        await logAudit({
          action: 'BOOK_ADDED',
          module: 'Inventory',
          target_ref: data.title,
          prev_value: '',
          new_value: `SKU: ${data.sku}, Genre: ${data.genre}, Status: ${data.status}`,
          explanation: `Admin added new book "${data.title}" by ${data.author} (SKU: ${data.sku}) to inventory`,
        });
      } else {
        toast.error('Create failed');
      }
    }
    setModalMode(null);
    setEditingBook(null);
  }, [modalMode, editingBook]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteBook(deleteTarget.id);
    setBooks(prev => prev.filter(b => b.id !== deleteTarget.id));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(deleteTarget.id); return next; });
    toast.success(`"${deleteTarget.title}" deleted`);
    await logAudit({
      action: 'BOOK_DELETED',
      module: 'Inventory',
      target_ref: deleteTarget.title,
      prev_value: `SKU: ${deleteTarget.sku}, Status: ${deleteTarget.status}`,
      new_value: 'DELETED',
      explanation: `Admin deleted book "${deleteTarget.title}" (SKU: ${deleteTarget.sku}) from inventory`,
    });
    setDeleteTarget(null);
  }, [deleteTarget]);

  const handleBulkAction = useCallback(async (action: 'genre' | 'batch' | 'status', value: string) => {
    const ids = Array.from(selectedIds);
    const updateData: Partial<Book> = {};
    if (action === 'genre') updateData.genre = value;
    if (action === 'batch') updateData.batch = value;
    await bulkUpdateBooks(ids, updateData);
    await loadBooks();
    toast.success(`Updated ${ids.length} books`);
    await logAudit({
      action: 'BULK_BOOKS_UPDATED',
      module: 'Inventory',
      target_ref: `${ids.length} books`,
      prev_value: '',
      new_value: `${action}: ${value}`,
      explanation: `Admin bulk-updated ${ids.length} book(s) — set ${action} to "${value}"`,
    });
    setSelectedIds(new Set());
  }, [selectedIds]);

  const clearFilters = () => {
    setSearch(''); setFilterGenre(''); setFilterFormat(''); setFilterStatus(''); setFilterBatch('');
  };

  const activeFilterCount = [filterGenre, filterFormat, filterStatus, filterBatch].filter(Boolean).length;

  return (
    <AdminLayout title="Inventory Control">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'var(--background-card)', border: '1px solid var(--border)', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('books')}
          className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
          style={activeTab === 'books'
            ? { background: 'var(--primary)', color: '#fff' }
            : { color: 'var(--foreground-muted)' }
          }
        >
          Book Management
        </button>
        <button
          onClick={() => setActiveTab('genre-edits')}
          className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
          style={activeTab === 'genre-edits'
            ? { background: 'var(--primary)', color: '#fff' }
            : { color: 'var(--foreground-muted)' }
          }
        >
          Genre Edits
        </button>
      </div>

      {activeTab === 'genre-edits' ? (
        <GenreEditsTab />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Titles', value: books.length },
              { label: 'On Hand', value: books.filter(b => b.status === 'On Hand').length },
              { label: 'Pre-order', value: books.filter(b => b.status === 'Pre-order').length },
              { label: 'Sold Out', value: books.filter(b => b.status === 'Sold Out').length },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                <p className="text-2xl font-bold font-display tabular-nums" style={{ color: 'var(--primary-bright)' }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Actions bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <button disabled className="btn-ghost text-sm px-4 py-2 rounded-lg flex items-center gap-2 opacity-40 cursor-not-allowed">
                <Icon name="ArrowUpTrayIcon" size={15} /> Import
              </button>
              <button disabled className="btn-ghost text-sm px-4 py-2 rounded-lg flex items-center gap-2 opacity-40 cursor-not-allowed">
                <Icon name="ArrowDownTrayIcon" size={15} /> Export
              </button>
            </div>
            <button onClick={openAdd} className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
              <Icon name="PlusIcon" size={16} /> Add Book
            </button>
          </div>

          {/* Search + Filters */}
          <div className="rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
            <div className="relative flex-1 min-w-[200px]">
              <Icon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
              <input type="search" placeholder="Search by title, author, SKU..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 py-2 text-sm" />
            </div>
            <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)} className="select-field text-sm py-2">
              <option value="">All Genres</option>
              {GENRES.map(g => <option key={g}>{g}</option>)}
            </select>
            <select value={filterFormat} onChange={e => setFilterFormat(e.target.value)} className="select-field text-sm py-2">
              <option value="">All Formats</option>
              {FORMATS.map(f => <option key={f}>{f}</option>)}
            </select>
            <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="select-field text-sm py-2">
              <option value="">All Batches</option>
              {BATCHES.map(b => <option key={b}>{b}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select-field text-sm py-2">
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="btn-ghost text-sm py-2 px-3 flex items-center gap-1.5">
                <Icon name="XMarkIcon" size={14} /> Clear ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <BulkActionsBar
              selectedCount={selectedIds.size}
              onAction={handleBulkAction}
              onClear={() => setSelectedIds(new Set())}
              genres={GENRES}
              batches={BATCHES}
            />
          )}

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
            </div>
          ) : (
            <InventoryTable
              books={filtered}
              selectedIds={selectedIds}
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={handleSort}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onEdit={openEdit}
              onDuplicate={openDuplicate}
              onDelete={openDelete}
            />
          )}

          {/* Modals */}
          {modalMode && (
            <BookFormModal
              mode={modalMode}
              book={editingBook}
              onSave={handleSave}
              onClose={() => { setModalMode(null); setEditingBook(null); }}
              genres={GENRES}
              formats={FORMATS}
              batches={BATCHES}
            />
          )}
          {deleteTarget && (
            <DeleteConfirmModal
              book={deleteTarget}
              onConfirm={handleDelete}
              onClose={() => setDeleteTarget(null)}
            />
          )}
        </>
      )}
    </AdminLayout>
  );
}
