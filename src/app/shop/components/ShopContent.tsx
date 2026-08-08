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

const PAGE_SIZE_OPTIONS = [15, 20, 30];
const FORMATS = ['Paperback', 'Hardcover', 'Special Edition', 'Omnibus', 'Bundle'];

export default function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<BookFilters>({
    search: '',
    genre: searchParams.get('genre') ?? '',
    subgenre: searchParams.get('subgenre') ?? '',
    format: '',
    status: '',
    series: '',
    source: '',
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
      // Build sorted unique author list
      const uniqueAuthors = [...new Set(books.map(b => b.author).filter(Boolean))].sort();
      setAuthors(uniqueAuthors);
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
    // Source filter: Pre-order = arrival_date in future, On Hand = available now, Bundle = format Bundle
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
    setFilters({ search: '', genre: '', subgenre: '', format: '', status: '', series: '', source: '' });
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