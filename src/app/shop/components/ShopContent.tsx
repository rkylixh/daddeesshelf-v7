'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import BookGrid from '@/components/books/BookGrid';
import ShopFilters from './ShopFilters';
import ShopHeader from './ShopHeader';
import ShopPagination from './ShopPagination';
import { getBooks, getDistinctGenres } from '@/lib/books';
import { Book, BookFilters } from '@/lib/types';
import { useRouter } from 'next/navigation';
import BatchEtaCalendar from '@/app/components/BatchEtaCalendar';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabase';

// ── Batch Calendar Modal ───────────────────────────────────
function BatchCalendarModal({
  batches,
  onClose,
}: {
  batches: { batch: string; eta: string; etaVisible: boolean; count: number }[];
  onClose: () => void;
}) {
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(30,18,10,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #F9F1E3 0%, #F4E8D2 100%)',
          boxShadow: '0 24px 64px rgba(75,53,42,0.35)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ background: 'rgba(249,241,227,0.97)', borderBottom: '1px solid rgba(200,164,91,0.3)', zIndex: 1 }}
        >
          <div className="flex items-center gap-2">
            <Icon name="CalendarIcon" size={16} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
            <h2 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>
              Batch ETA Calendar
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(200,164,91,0.15)', color: 'var(--foreground-muted)', border: '1px solid rgba(200,164,91,0.3)' }}
            aria-label="Close calendar"
          >
            <Icon name="XMarkIcon" size={16} />
          </button>
        </div>
        <div className="p-4">
          <BatchEtaCalendar batches={batches} />
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [15, 20, 30];
const FORMATS = ['Paperback', 'Hardcover', 'Special Edition', 'Omnibus', 'Bundle'];

export default function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [allBatchEtas, setAllBatchEtas] = useState<{ batch: string; eta: string; etaVisible: boolean; count: number }[]>([]);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const [filters, setFilters] = useState<BookFilters>({
    search: '',
    genre: searchParams.get('genre') ?? '',
    subgenre: searchParams.get('subgenre') ?? '',
    format: '',
    status: '',
    series: '',
    source: '',
    batch: '',
  });
  const [authorFilter, setAuthorFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sort, setSort] = useState<'title-asc' | 'price-asc' | 'price-desc' | 'newest'>('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [books, genreList] = await Promise.all([getBooks(), getDistinctGenres()]);
      setAllBooks(books);
      setGenres(genreList);
      const uniqueAuthors = [...new Set(books.map(b => b.author).filter(Boolean))].sort();
      setAuthors(uniqueAuthors);
      const uniqueBatches = [...new Set(books.map(b => b.batch).filter(Boolean))].sort();
      setBatches(uniqueBatches);

      // Fetch batch ETA data for the calendar
      const { data: batchRows } = await supabase
        .from('books')
        .select('batch, arrival_date')
        .eq('is_visible', true)
        .not('arrival_date', 'is', null)
        .order('arrival_date', { ascending: true });

      if (batchRows && batchRows.length > 0) {
        const batchEtaMap: Record<string, { eta: string; count: number; etaVisible: boolean }> = {};
        for (const r of batchRows) {
          const bName = String(r.batch ?? '');
          const bEta = String(r.arrival_date ?? '');
          if (!bName || !bEta) continue;
          if (!batchEtaMap[bName]) {
            batchEtaMap[bName] = { eta: bEta, count: 0, etaVisible: true };
          }
          batchEtaMap[bName].count += 1;
        }
        setAllBatchEtas(
          Object.entries(batchEtaMap).map(([batch, info]) => ({
            batch,
            eta: info.eta,
            etaVisible: info.etaVisible,
            count: info.count,
          }))
        );
      }

      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let books = [...allBooks];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      books = books.filter(
        b =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.sku.toLowerCase().includes(q) ||
          b.genre.toLowerCase().includes(q) ||
          b.subgenre.toLowerCase().includes(q) ||
          (b.series && b.series.toLowerCase().includes(q))
      );
    }
    if (filters.genre) books = books.filter(b => b.genre === filters.genre);
    if (filters.subgenre) books = books.filter(b => b.subgenre === filters.subgenre);
    if (filters.format) books = books.filter(b => b.format === filters.format);
    if (filters.status) books = books.filter(b => b.status === filters.status);
    if (filters.batch) books = books.filter(b => b.batch === filters.batch);
    // Source filter
    if (filters.source === 'Pre-order') books = books.filter(b => b.status === 'Pre-order');
    else if (filters.source === 'On Hand') books = books.filter(b => b.status === 'On Hand');
    else if (filters.source === 'Bundle') books = books.filter(b => b.format === 'Bundle');
    // Author filter
    if (authorFilter) books = books.filter(b => b.author === authorFilter);
    // Price range filter
    const minVal = priceMin !== '' ? Number(priceMin) : null;
    const maxVal = priceMax !== '' ? Number(priceMax) : null;
    if (minVal !== null && !isNaN(minVal)) books = books.filter(b => b.final_srp >= minVal);
    if (maxVal !== null && !isNaN(maxVal)) books = books.filter(b => b.final_srp <= maxVal);

    if (sort === 'title-asc') books.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'price-asc') books.sort((a, b) => a.final_srp - b.final_srp);
    else if (sort === 'price-desc') books.sort((a, b) => b.final_srp - a.final_srp);
    else books.sort((a, b) => (a.batch ?? '').localeCompare(b.batch ?? ''));

    return books;
  }, [allBooks, filters, sort, authorFilter, priceMin, priceMax]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleFilterChange = (key: keyof BookFilters, value: string) => {
    if (key === 'author') {
      setAuthorFilter(value);
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
    setPage(1);
  };

  const handlePriceChange = (min: string, max: string) => {
    setPriceMin(min);
    setPriceMax(max);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', genre: '', subgenre: '', format: '', status: '', series: '', source: '', batch: '' });
    setAuthorFilter('');
    setPriceMin('');
    setPriceMax('');
    setPage(1);
  };

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length +
    (authorFilter ? 1 : 0) +
    (priceMin ? 1 : 0) +
    (priceMax ? 1 : 0);

  if (loading) {
    return (
      <div className="content-wrapper py-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="content-wrapper py-8">
      {/* Batch Calendar Modal */}
      {showCalendarModal && allBatchEtas.length > 0 && (
        <BatchCalendarModal batches={allBatchEtas} onClose={() => setShowCalendarModal(false)} />
      )}

      {(searchParams.get('genre') || searchParams.get('subgenre')) && (
        <button
          onClick={() => {
            const subgenre = searchParams.get('subgenre');
            const genre = searchParams.get('genre');
            if (subgenre && genre) {
              router.push(`/genres?genre=${encodeURIComponent(genre)}`);
            } else {
              router.back();
            }
          }}
          className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: 'var(--foreground-muted)' }}
        >
          {searchParams.get('subgenre') ? '← Back to Subgenres' : '← Back to Genres'}
        </button>
      )}
      <ShopHeader
        totalCount={filtered.length}
        sort={sort}
        onSortChange={setSort}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen(o => !o)}
        activeFilterCount={activeFilterCount}
        search={filters.search}
        onSearchChange={val => handleFilterChange('search', val)}
      />

      {/* Batch ETA Calendar button */}
      {allBatchEtas.length > 0 && (
        <div className="flex justify-end mt-3 mb-1">
          <button
            onClick={() => setShowCalendarModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: 'rgba(200,164,91,0.14)',
              border: '1px solid rgba(200,164,91,0.45)',
              color: 'var(--primary-bright)',
              boxShadow: '0 2px 8px rgba(200,164,91,0.12)',
            }}
          >
            <Icon name="CalendarIcon" size={13} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
            Batch ETA
          </button>
        </div>
      )}

      <div className="flex gap-6 mt-6">
        {/* Filter Sidebar */}
        <aside
          className={`flex-shrink-0 transition-all duration-300 ${filtersOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'} lg:w-56 lg:opacity-100 lg:block`}
        >
          <ShopFilters
            filters={{ ...filters, author: authorFilter }}
            genres={genres}
            formats={FORMATS}
            authors={authors}
            batches={batches}
            onFilterChange={handleFilterChange}
            onPriceChange={handlePriceChange}
            onClear={clearFilters}
            activeCount={activeFilterCount}
            priceMin={priceMin}
            priceMax={priceMax}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <BookGrid books={paginated} showQuickAdd emptyMessage="No books match your current filters. Try clearing some filters or broadening your search." />
          {filtered.length > 0 && (
            <ShopPagination
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={size => { setPageSize(size); setPage(1); }}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          )}
        </div>
      </div>
    </div>
  );
}