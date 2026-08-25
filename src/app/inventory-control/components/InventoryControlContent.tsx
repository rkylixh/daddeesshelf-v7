'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { Book } from '@/lib/types';
import { getAllBooksAdmin, createBook, updateBook, deleteBook, bulkUpdateBooks, getDistinctGenres, getDistinctBatches } from '@/lib/books';
import InventoryTable from './InventoryTable';
import BookFormModal from './BookFormModal';
import BulkActionsBar from './BulkActionsBar';
import DeleteConfirmModal from './DeleteConfirmModal';
import { toast } from 'sonner';

const FORMATS = ['Paperback', 'Hardcover', 'Special Edition', 'Omnibus', 'Bundle'];

export type ModalMode = 'add' | 'edit' | 'duplicate' | null;

export default function InventoryControlContent() {
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterFormat, setFilterFormat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterSynopsis, setFilterSynopsis] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [sortCol, setSortCol] = useState<keyof Book>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loadBooks = useCallback(async () => {
    setLoading(true);
    const [data, genreList, batchList] = await Promise.all([
      getAllBooksAdmin(),
      getDistinctGenres(),
      getDistinctBatches(),
    ]);
    setBooks(data);
    setGenres(genreList);
    setBatches(batchList);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const filtered = useMemo(() => {
    let result = [...books];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        b =>
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
    if (filterSynopsis === 'has') result = result.filter(b => b.synopsis && b.synopsis.trim().length > 0);
    if (filterSynopsis === 'missing') result = result.filter(b => !b.synopsis || b.synopsis.trim().length === 0);

    result.sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [books, search, filterGenre, filterFormat, filterStatus, filterBatch, filterSynopsis, sortCol, sortDir]);

  const handleSort = (col: keyof Book) => {
    if (sortCol === col) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
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
  const openDuplicate = (book: Book) => { setEditingBook({ ...book, id: '', sku: `${book.sku}-COPY`, title: `${book.title} (Copy)` }); setModalMode('duplicate'); };
  const openDelete = (book: Book) => setDeleteTarget(book);

  const handleSave = useCallback(async (data: Omit<Book, 'id' | 'created_at' | 'updated_at'>) => {
    if (modalMode === 'edit' && editingBook) {
      const updated = await updateBook(editingBook.id, data);
      if (updated) {
        setBooks(prev => prev.map(b => b.id === editingBook.id ? updated : b));
        toast.success(`"${data.title}" updated successfully`);
      } else {
        toast.error('Update failed');
      }
    } else {
      const created = await createBook(data as Omit<Book, 'id' | 'created_at' | 'updated_at' | 'available' | 'status'>);
      if (created) {
        setBooks(prev => [created, ...prev]);
        toast.success(`"${data.title}" added to inventory`);
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
    toast.success(`"${deleteTarget.title}" deleted from inventory`);
    setDeleteTarget(null);
  }, [deleteTarget]);

  const handleBulkAction = useCallback(async (action: 'genre' | 'batch' | 'status', value: string) => {
    const ids = Array.from(selectedIds);
    const updateData: Partial<Book> = {};
    if (action === 'genre') updateData.genre = value;
    if (action === 'batch') updateData.batch = value;
    await bulkUpdateBooks(ids, updateData);
    await loadBooks();
    toast.success(`Updated ${ids.length} books — ${action} set to "${value}"`);
    setSelectedIds(new Set());
  }, [selectedIds, loadBooks]);

  const clearFilters = () => {
    setSearch('');
    setFilterGenre('');
    setFilterFormat('');
    setFilterStatus('');
    setFilterBatch('');
    setFilterSynopsis('');
  };

  const activeFilterCount = [filterGenre, filterFormat, filterStatus, filterBatch, filterSynopsis].filter(Boolean).length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Admin Topbar */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 h-14 z-30 sticky top-0"
        style={{
          background: 'rgba(10,10,15,0.98)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo size={26} />
            <span className="font-display text-sm font-semibold" style={{ color: 'var(--primary-bright)' }}>
              Daddee&apos;s Shelf
            </span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--foreground-subtle)', border: '1px solid var(--border)' }}>
            Admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/" className="btn-ghost text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Icon name="ArrowLeftIcon" size={14} />
            Back to Site
          </Link>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 max-w-screen-2xl mx-auto w-full">

        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              Inventory Control
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
              {books.length} total titles · {books.filter(b => b.status === 'On Hand').length} on hand ·{' '}
              {books.filter(b => b.status === 'Pre-order').length} on pre-order ·{' '}
              {books.filter(b => b.status === 'Sold Out').length} sold out
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button disabled className="btn-ghost text-sm px-4 py-2 rounded-lg flex items-center gap-2 opacity-40 cursor-not-allowed" title="Import Inventory — coming soon">
              <Icon name="ArrowUpTrayIcon" size={15} />
              Import
            </button>
            <button disabled className="btn-ghost text-sm px-4 py-2 rounded-lg flex items-center gap-2 opacity-40 cursor-not-allowed" title="Export Inventory — coming soon">
              <Icon name="ArrowDownTrayIcon" size={15} />
              Export
            </button>
            <button onClick={openAdd} className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
              <Icon name="PlusIcon" size={16} />
              Add Book
            </button>
          </div>
        </div>

        {/* Search + Filters row */}
        <div
          className="rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end"
          style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Icon
              name="MagnifyingGlassIcon"
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties}
            />
            <input
              type="search"
              placeholder="Search by title, author, SKU, genre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>

          {/* Genre filter */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Genre</label>
            <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)} className="select-field text-sm py-2">
              <option value="">All Genres</option>
              {genres.map(g => <option key={`admin-filter-genre-${g}`} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Format filter */}
          <div className="flex flex-col gap-1 min-w-[130px]">
            <label className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Format</label>
            <select value={filterFormat} onChange={e => setFilterFormat(e.target.value)} className="select-field text-sm py-2">
              <option value="">All Formats</option>
              {FORMATS.map(f => <option key={`admin-filter-format-${f}`} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Batch filter */}
          <div className="flex flex-col gap-1 min-w-[120px]">
            <label className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Batch</label>
            <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="select-field text-sm py-2">
              <option value="">All Batches</option>
              {batches.map(b => <option key={`admin-filter-batch-${b}`} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex flex-col gap-1 min-w-[130px]">
            <label className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select-field text-sm py-2">
              <option value="">All Statuses</option>
              <option value="Pre-order">Pre-order</option>
              <option value="On Hand">On Hand</option>
              <option value="Sold Out">Sold Out</option>
            </select>
          </div>

          {/* Synopsis filter */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Synopsis</label>
            <select value={filterSynopsis} onChange={e => setFilterSynopsis(e.target.value)} className="select-field text-sm py-2">
              <option value="">All Books</option>
              <option value="has">Has Synopsis</option>
              <option value="missing">Missing Synopsis</option>
            </select>
          </div>

          {/* Clear filters */}
          {(search || activeFilterCount > 0) && (
            <button onClick={clearFilters} className="btn-ghost text-sm px-3 py-2 rounded-lg flex items-center gap-1.5 self-end" style={{ border: '1px solid var(--border)' }}>
              <Icon name="XMarkIcon" size={14} />
              Clear ({activeFilterCount + (search ? 1 : 0)})
            </button>
          )}

          <div className="self-end ml-auto">
            <p className="text-xs text-right" style={{ color: 'var(--foreground-subtle)' }}>
              {filtered.length} of {books.length} titles
            </p>
          </div>
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.size}
            genres={genres}
            batches={batches}
            onBulkAction={handleBulkAction}
            onClearSelection={() => setSelectedIds(new Set())}
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
            totalCount={filtered.length}
          />
        )}
      </div>

      {/* Modals */}
      {modalMode && (
        <BookFormModal
          mode={modalMode}
          initialData={editingBook}
          genres={genres}
          formats={FORMATS}
          batches={batches}
          onSave={handleSave}
          onClose={() => { setModalMode(null); setEditingBook(null); }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          book={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}