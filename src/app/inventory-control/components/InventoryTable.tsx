'use client';

import React from 'react';
import AppImage from '@/components/ui/AppImage';
import StatusBadge from '@/components/books/StatusBadge';
import Icon from '@/components/ui/AppIcon';
import { Book } from '@/lib/types';

interface Props {
  books: Book[];
  selectedIds: Set<string>;
  sortCol: keyof Book;
  sortDir: 'asc' | 'desc';
  onSort: (col: keyof Book) => void;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onEdit: (book: Book) => void;
  onDuplicate: (book: Book) => void;
  onDelete: (book: Book) => void;
  totalCount: number;
}

type ColDef = {
  key: keyof Book | 'available' | 'actions' | 'cover';
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'right' | 'center';
};

const COLUMNS: ColDef[] = [
  { key: 'cover', label: '', width: '52px', align: 'center' },
  { key: 'sku', label: 'SKU', sortable: true, width: '110px' },
  { key: 'title', label: 'Title', sortable: true, width: '200px' },
  { key: 'author', label: 'Author', sortable: true, width: '140px' },
  { key: 'genre', label: 'Genre', sortable: true, width: '110px' },
  { key: 'subgenre', label: 'Subgenre', width: '120px' },
  { key: 'series', label: 'Series', width: '120px' },
  { key: 'format', label: 'Format', sortable: true, width: '100px' },
  { key: 'edition', label: 'Edition', width: '100px' },
  { key: 'final_srp', label: 'SRP', sortable: true, width: '80px', align: 'right' },
  { key: 'inventory', label: 'Inv.', sortable: true, width: '60px', align: 'right' },
  { key: 'reserved', label: 'Rsv.', sortable: true, width: '60px', align: 'right' },
  { key: 'available', label: 'Avail.', sortable: true, width: '68px', align: 'right' },
  { key: 'batch', label: 'Batch', sortable: true, width: '90px' },
  { key: 'arrival_date', label: 'Arrival', sortable: true, width: '100px' },
  { key: 'status', label: 'Status', sortable: true, width: '110px' },
  { key: 'actions', label: '', width: '90px', align: 'center' },
];

function SortIcon({ col, sortCol, sortDir }: { col: keyof Book | string; sortCol: keyof Book; sortDir: 'asc' | 'desc' }) {
  if (col !== sortCol) return <Icon name="ChevronUpDownIcon" size={12} style={{ color: 'var(--foreground-subtle)', opacity: 0.5 } as React.CSSProperties} />;
  return sortDir === 'asc'
    ? <Icon name="ChevronUpIcon" size={12} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
    : <Icon name="ChevronDownIcon" size={12} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />;
}

function AvailabilityBar({ available, inventory }: { available: number; inventory: number }) {
  const pct = inventory > 0 ? Math.max(0, Math.min(100, (available / inventory) * 100)) : 0;
  const color = pct === 0 ? 'var(--status-soldout)' : pct < 30 ? '#f59e0b' : 'var(--status-onhand)';
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-xs tabular-nums font-semibold" style={{ color }}>
        {available}
      </span>
      <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function InventoryTable({
  books,
  selectedIds,
  sortCol,
  sortDir,
  onSort,
  onSelectAll,
  onSelectOne,
  onEdit,
  onDuplicate,
  onDelete,
  totalCount,
}: Props) {
  const allSelected = books.length > 0 && books.every(b => selectedIds.has(b.id));
  const someSelected = books.some(b => selectedIds.has(b.id));

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
  };

  if (books.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 rounded-xl"
        style={{ border: '1px dashed var(--border)', background: 'var(--background-card)' }}
      >
        <Icon name="BookOpenIcon" size={36} style={{ color: 'var(--foreground-subtle)', marginBottom: '12px' } as React.CSSProperties} />
        <h3 className="font-display text-base font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>
          No books match your filters
        </h3>
        <p className="text-sm" style={{ color: 'var(--foreground-subtle)' }}>
          Try adjusting your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--background-card)' }}
    >
      <div className="overflow-x-auto scrollbar-custom">
        <table className="w-full" style={{ minWidth: '1400px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
              {/* Checkbox */}
              <th className="w-10 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={e => onSelectAll(e.target.checked)}
                  className="rounded"
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                  aria-label="Select all books"
                />
              </th>
              {COLUMNS.map(col => (
                <th
                  key={`th-${col.key}`}
                  className={`px-3 py-3 text-${col.align ?? 'left'} whitespace-nowrap`}
                  style={{
                    width: col.width,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--foreground-subtle)',
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={col.sortable ? () => onSort(col.key as keyof Book) : undefined}
                >
                  <span className="flex items-center gap-1 justify-inherit">
                    {col.label}
                    {col.sortable && (
                      <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {books.map((book, idx) => {
              const isSelected = selectedIds.has(book.id);
              const available = book.available ?? (book.inventory - book.reserved);
              const isLowStock = available > 0 && available <= 2;
              return (
                <tr
                  key={book.id}
                  className="table-row-hover transition-colors group"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: isSelected
                      ? 'rgba(139,92,246,0.06)'
                      : idx % 2 === 1
                      ? 'rgba(255,255,255,0.01)'
                      : 'transparent',
                  }}
                >
                  {/* Checkbox */}
                  <td className="w-10 px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => onSelectOne(book.id, e.target.checked)}
                      style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                      aria-label={`Select ${book.title}`}
                    />
                  </td>

                  {/* Cover */}
                  <td className="px-2 py-2 text-center">
                    <div className="relative w-8 h-12 rounded overflow-hidden mx-auto">
                      <AppImage
                        src={book.cover_url || '/assets/images/no_image.png'}
                        alt={`Cover of ${book.title}`}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                  </td>

                  {/* SKU */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-mono" style={{ color: 'var(--foreground-subtle)' }}>
                      {book.sku}
                    </span>
                  </td>

                  {/* Title */}
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => onEdit(book)}
                      className="text-left text-sm font-semibold hover:underline line-clamp-2 max-w-[200px]"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {book.title}
                    </button>
                  </td>

                  {/* Author */}
                  <td className="px-3 py-2.5">
                    <span className="text-sm truncate block max-w-[140px]" style={{ color: 'var(--foreground-muted)' }}>
                      {book.author}
                    </span>
                  </td>

                  {/* Genre */}
                  <td className="px-3 py-2.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}
                    >
                      {book.genre}
                    </span>
                  </td>

                  {/* Subgenre */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs truncate block max-w-[120px]" style={{ color: 'var(--foreground-subtle)' }}>
                      {book.subgenre || '—'}
                    </span>
                  </td>

                  {/* Series */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs truncate block max-w-[120px]" style={{ color: 'var(--foreground-subtle)' }}>
                      {book.series ? `${book.series}${book.series_order ? ` #${book.series_order}` : ''}` : '—'}
                    </span>
                  </td>

                  {/* Format */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      {book.format}
                    </span>
                  </td>

                  {/* Edition */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs truncate block max-w-[100px]" style={{ color: 'var(--foreground-subtle)' }}>
                      {book.edition || '—'}
                    </span>
                  </td>

                  {/* SRP */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
                      ₱{book.final_srp.toLocaleString()}
                    </span>
                  </td>

                  {/* Inventory */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-sm tabular-nums" style={{ color: 'var(--foreground-muted)' }}>
                      {book.inventory}
                    </span>
                  </td>

                  {/* Reserved */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-sm tabular-nums" style={{ color: book.reserved > 0 ? '#f59e0b' : 'var(--foreground-subtle)' }}>
                      {book.reserved}
                    </span>
                  </td>

                  {/* Available */}
                  <td className="px-3 py-2.5 text-right">
                    <AvailabilityBar available={available} inventory={book.inventory} />
                  </td>

                  {/* Batch */}
                  <td className="px-3 py-2.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: 'var(--muted)', color: 'var(--accent-light)', border: '1px solid var(--border)' }}
                    >
                      {book.batch || '—'}
                    </span>
                  </td>

                  {/* Arrival Date */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs tabular-nums" style={{ color: 'var(--foreground-subtle)' }}>
                      {formatDate(book.arrival_date)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5">
                    <StatusBadge status={book.status!} size="sm" />
                    {isLowStock && (
                      <p className="text-xs mt-0.5" style={{ color: '#f59e0b' }}>Low stock</p>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(book)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'var(--foreground-muted)' }}
                        title={`Edit "${book.title}"`}
                        aria-label={`Edit ${book.title}`}
                      >
                        <Icon name="PencilIcon" size={14} />
                      </button>
                      <button
                        onClick={() => onDuplicate(book)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'var(--foreground-muted)' }}
                        title={`Duplicate "${book.title}"`}
                        aria-label={`Duplicate ${book.title}`}
                      >
                        <Icon name="DocumentDuplicateIcon" size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(book)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'var(--foreground-muted)' }}
                        title={`Delete "${book.title}" — this cannot be undone`}
                        aria-label={`Delete ${book.title}`}
                      >
                        <Icon name="TrashIcon" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table footer */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--muted)' }}
      >
        <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
          {selectedIds.size > 0 ? `${selectedIds.size} selected · ` : ''}{totalCount} {totalCount === 1 ? 'title' : 'titles'}
        </p>
        <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
          Last synced: just now
        </p>
      </div>
    </div>
  );
}