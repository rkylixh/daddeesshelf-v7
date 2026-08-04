'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Icon from '@/components/ui/AppIcon';
import { Book, BookFormat } from '@/lib/types';
import { ModalMode } from './InventoryControlContent';

interface Props {
  mode: ModalMode;
  initialData: Book | null;
  genres: string[];
  formats: string[];
  batches: string[];
  onSave: (data: Omit<Book, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

type FormValues = {
  cover_url: string;
  sku: string;
  title: string;
  author: string;
  genre: string;
  subgenre: string;
  series: string;
  series_order: string;
  format: string;
  edition: string;
  final_srp: string;
  batch: string;
  arrival_date: string;
  inventory: string;
  reserved: string;
  synopsis: string;
};

const TITLE_MAP: Record<NonNullable<ModalMode>, string> = {
  add: 'Add New Book',
  edit: 'Edit Book',
  duplicate: 'Duplicate Book',
};

export default function BookFormModal({ mode, initialData, genres, formats, batches, onSave, onClose }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      cover_url: '',
      sku: '',
      title: '',
      author: '',
      genre: '',
      subgenre: '',
      series: '',
      series_order: '',
      format: 'Paperback',
      edition: '',
      final_srp: '',
      batch: '',
      arrival_date: '',
      inventory: '0',
      reserved: '0',
      synopsis: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        cover_url: initialData.cover_url ?? '',
        sku: initialData.sku ?? '',
        title: initialData.title ?? '',
        author: initialData.author ?? '',
        genre: initialData.genre ?? '',
        subgenre: initialData.subgenre ?? '',
        series: initialData.series ?? '',
        series_order: initialData.series_order?.toString() ?? '',
        format: initialData.format ?? 'Paperback',
        edition: initialData.edition ?? '',
        final_srp: initialData.final_srp?.toString() ?? '',
        batch: initialData.batch ?? '',
        arrival_date: initialData.arrival_date ?? '',
        inventory: initialData.inventory?.toString() ?? '0',
        reserved: initialData.reserved?.toString() ?? '0',
        synopsis: initialData.synopsis ?? '',
      });
    }
  }, [initialData, reset]);

  const inventoryVal = Number(watch('inventory') || 0);
  const reservedVal = Number(watch('reserved') || 0);
  const availableComputed = inventoryVal - reservedVal;

  const arrivalDate = watch('arrival_date');
  let derivedStatus = 'On Hand';
  if (arrivalDate && new Date(arrivalDate) > new Date()) derivedStatus = 'Pre-order';
  else if (availableComputed <= 0) derivedStatus = 'Sold Out';

  const onSubmit = (values: FormValues) => {
    onSave({
      cover_url: values.cover_url,
      sku: values.sku,
      title: values.title,
      author: values.author,
      genre: values.genre,
      subgenre: values.subgenre,
      series: values.series,
      series_order: values.series_order ? Number(values.series_order) : null,
      format: values.format as BookFormat,
      edition: values.edition,
      final_srp: Number(values.final_srp),
      batch: values.batch,
      arrival_date: values.arrival_date || null,
      inventory: Number(values.inventory),
      reserved: Number(values.reserved),
      synopsis: values.synopsis,
      available: availableComputed,
      status: derivedStatus as Book['status'],
    });
  };

  const inputClass = 'input-field text-sm py-2';
  const labelClass = 'block text-xs font-medium mb-1';
  const errorClass = 'text-xs mt-1';

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="book-modal-title">
      <div className="modal-content w-full max-w-2xl mx-4">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0"
          style={{
            background: 'var(--background-card)',
            borderBottom: '1px solid var(--border)',
            zIndex: 1,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
            >
              <Icon name="BookOpenIcon" size={16} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
            </div>
            <h2 id="book-modal-title" className="font-display text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              {mode ? TITLE_MAP[mode] : ''}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg" aria-label="Close modal">
            <Icon name="XMarkIcon" size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-6 py-5 space-y-6">

            {/* Section: Cover & Identifiers */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-subtle)', letterSpacing: '0.12em' }}>
                Identification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="cover_url" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Cover Image URL
                  </label>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--foreground-subtle)' }}>
                    Direct link to the book cover image (JPG, PNG, WebP)
                  </p>
                  <input
                    id="cover_url"
                    type="url"
                    placeholder="https://covers.openlibrary.org/b/id/..."
                    className={inputClass}
                    {...register('cover_url')}
                  />
                </div>
                <div>
                  <label htmlFor="sku" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    SKU <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--foreground-subtle)' }}>
                    Unique identifier, e.g. DS-FIC-001
                  </p>
                  <input
                    id="sku"
                    type="text"
                    placeholder="DS-GEN-001"
                    className={inputClass}
                    {...register('sku', { required: 'SKU is required' })}
                  />
                  {errors.sku && <p className={errorClass} style={{ color: '#ef4444' }}>{errors.sku.message}</p>}
                </div>
                <div>
                  <label htmlFor="format" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Format <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="format"
                    className="select-field text-sm py-2 w-full"
                    {...register('format', { required: 'Format is required' })}
                  >
                    {formats.map(f => <option key={`modal-format-${f}`} value={f}>{f}</option>)}
                  </select>
                  {errors.format && <p className={errorClass} style={{ color: '#ef4444' }}>{errors.format.message}</p>}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)' }} />

            {/* Section: Book Info */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-subtle)', letterSpacing: '0.12em' }}>
                Book Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="title" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Title <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    placeholder="Book title"
                    className={inputClass}
                    {...register('title', { required: 'Title is required' })}
                  />
                  {errors.title && <p className={errorClass} style={{ color: '#ef4444' }}>{errors.title.message}</p>}
                </div>
                <div>
                  <label htmlFor="author" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Author <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="author"
                    type="text"
                    placeholder="Author name"
                    className={inputClass}
                    {...register('author', { required: 'Author is required' })}
                  />
                  {errors.author && <p className={errorClass} style={{ color: '#ef4444' }}>{errors.author.message}</p>}
                </div>
                <div>
                  <label htmlFor="edition" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Edition
                  </label>
                  <input
                    id="edition"
                    type="text"
                    placeholder="e.g. 1st Edition, Anniversary Edition"
                    className={inputClass}
                    {...register('edition')}
                  />
                </div>
                <div>
                  <label htmlFor="genre" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Genre <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="genre"
                    className="select-field text-sm py-2 w-full"
                    {...register('genre', { required: 'Genre is required' })}
                  >
                    <option value="">Select genre...</option>
                    {genres.map(g => <option key={`modal-genre-${g}`} value={g}>{g}</option>)}
                  </select>
                  {errors.genre && <p className={errorClass} style={{ color: '#ef4444' }}>{errors.genre.message}</p>}
                </div>
                <div>
                  <label htmlFor="subgenre" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Subgenre
                  </label>
                  <input
                    id="subgenre"
                    type="text"
                    placeholder="e.g. Fantasy Romance, Cozy Mystery"
                    className={inputClass}
                    {...register('subgenre')}
                  />
                </div>
                <div>
                  <label htmlFor="series" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Series
                  </label>
                  <input
                    id="series"
                    type="text"
                    placeholder="Series name (if applicable)"
                    className={inputClass}
                    {...register('series')}
                  />
                </div>
                <div>
                  <label htmlFor="series_order" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Series Order
                  </label>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--foreground-subtle)' }}>
                    Book number in the series
                  </p>
                  <input
                    id="series_order"
                    type="number"
                    placeholder="1"
                    min="1"
                    className={inputClass}
                    {...register('series_order', { min: { value: 1, message: 'Must be at least 1' } })}
                  />
                  {errors.series_order && <p className={errorClass} style={{ color: '#ef4444' }}>{errors.series_order.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="synopsis" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Synopsis
                  </label>
                  <textarea
                    id="synopsis"
                    rows={3}
                    placeholder="Book description / back-cover synopsis..."
                    className={`${inputClass} resize-none`}
                    {...register('synopsis')}
                  />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)' }} />

            {/* Section: Pricing & Inventory */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-subtle)', letterSpacing: '0.12em' }}>
                Pricing & Inventory
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="final_srp" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Final SRP (₱) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="final_srp"
                    type="number"
                    placeholder="450"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    {...register('final_srp', {
                      required: 'SRP is required',
                      min: { value: 0, message: 'Must be ≥ 0' },
                    })}
                  />
                  {errors.final_srp && <p className={errorClass} style={{ color: '#ef4444' }}>{errors.final_srp.message}</p>}
                </div>
                <div>
                  <label htmlFor="inventory" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Inventory <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--foreground-subtle)' }}>Total copies</p>
                  <input
                    id="inventory"
                    type="number"
                    placeholder="0"
                    min="0"
                    className={inputClass}
                    {...register('inventory', {
                      required: 'Inventory is required',
                      min: { value: 0, message: 'Must be ≥ 0' },
                    })}
                  />
                  {errors.inventory && <p className={errorClass} style={{ color: '#ef4444' }}>{errors.inventory.message}</p>}
                </div>
                <div>
                  <label htmlFor="reserved" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Reserved
                  </label>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--foreground-subtle)' }}>Committed copies</p>
                  <input
                    id="reserved"
                    type="number"
                    placeholder="0"
                    min="0"
                    className={inputClass}
                    {...register('reserved', { min: { value: 0, message: 'Must be ≥ 0' } })}
                  />
                  {errors.reserved && <p className={errorClass} style={{ color: '#ef4444' }}>{errors.reserved.message}</p>}
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Available (computed)
                  </label>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--foreground-subtle)' }}>Inventory − Reserved</p>
                  <div
                    className="input-field flex items-center justify-between text-sm font-bold tabular-nums"
                    style={{
                      opacity: 0.7,
                      cursor: 'not-allowed',
                      color: availableComputed < 0 ? '#ef4444' : availableComputed === 0 ? 'var(--foreground-subtle)' : 'var(--status-onhand)',
                    }}
                  >
                    {availableComputed}
                    {availableComputed < 0 && (
                      <Icon name="ExclamationTriangleIcon" size={14} style={{ color: '#ef4444' } as React.CSSProperties} />
                    )}
                  </div>
                  {availableComputed < 0 && (
                    <p className={errorClass} style={{ color: '#ef4444' }}>Reserved exceeds inventory</p>
                  )}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)' }} />

            {/* Section: Batch & Status */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-subtle)', letterSpacing: '0.12em' }}>
                Batch & Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="batch" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Batch
                  </label>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--foreground-subtle)' }}>
                    e.g. Batch 3, Batch 4
                  </p>
                  <input
                    id="batch"
                    type="text"
                    placeholder="Batch 4"
                    className={inputClass}
                    list="batch-suggestions"
                    {...register('batch')}
                  />
                  <datalist id="batch-suggestions">
                    {['Batch 3', 'Batch 4', 'Batch 5', 'Batch 6'].map(b => (
                      <option key={`datalist-${b}`} value={b} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="arrival_date" className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Arrival Date
                  </label>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--foreground-subtle)' }}>
                    Expected arrival — drives Pre-order status
                  </p>
                  <input
                    id="arrival_date"
                    type="date"
                    className={inputClass}
                    {...register('arrival_date')}
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--foreground-muted)' }}>
                    Derived Status
                  </label>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--foreground-subtle)' }}>
                    Auto-computed from date + availability
                  </p>
                  <div
                    className="input-field flex items-center text-sm font-medium"
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  >
                    <span
                      className={
                        derivedStatus === 'Pre-order' ?'badge-preorder'
                          : derivedStatus === 'On Hand' ?'badge-onhand' :'badge-soldout'
                      }
                    >
                      {derivedStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between gap-3 px-6 py-4 sticky bottom-0"
            style={{
              borderTop: '1px solid var(--border)',
              background: 'var(--background-card)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
              <span style={{ color: '#ef4444' }}>*</span> Required fields
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost text-sm px-5 py-2.5 rounded-xl"
                style={{ border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || availableComputed < 0}
                className="btn-primary text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ minWidth: '120px', justifyContent: 'center' }}
              >
                {isSubmitting ? (
                  <>
                    <Icon name="ArrowPathIcon" size={15} className="animate-spin" />
                    Saving...
                  </>
                ) : mode === 'edit' ? (
                  'Save Changes'
                ) : (
                  'Add Book'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}