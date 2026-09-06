'use client';

import React from 'react';
import { BookFilters } from '@/lib/types';

interface Props {
  filters: BookFilters;
  genres: string[];
  formats: string[];
  authors: string[];
  batches: string[];
  tropes: string[];
  onFilterChange: (key: keyof BookFilters, value: string | string[]) => void;
  onPriceChange: (min: string, max: string) => void;
  onClear: () => void;
  activeCount: number;
  priceMin: string;
  priceMax: string;
}

const STATUSES = ['Pre-order', 'On Hand', 'Sold Out'];
const SOURCES = ['Pre-order', 'On Hand', 'Bundle'];

export default function ShopFilters({
  filters,
  genres,
  formats,
  authors,
  batches,
  tropes,
  onFilterChange,
  onPriceChange,
  onClear,
  activeCount,
  priceMin,
  priceMax,
}: Props) {
  const selectedTropes = filters.selectedTropes ?? [];
  const tropeMatchMode = filters.tropeMatchMode ?? 'any';

  const handleTropeToggle = (trope: string) => {
    const updated = selectedTropes.includes(trope)
      ? selectedTropes.filter(t => t !== trope)
      : [...selectedTropes, trope];
    onFilterChange('selectedTropes', updated);
  };

  const handleTropeMatchMode = (mode: 'all' | 'any') => {
    onFilterChange('tropeMatchMode', mode);
  };

  return (
    <div
      className="rounded-xl p-4 space-y-5 sticky top-20"
      style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)', letterSpacing: '0.12em' }}>
          Filters
        </h3>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-xs transition-colors"
            style={{ color: 'var(--primary-bright)' }}
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {/* Source */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>
          Source
        </label>
        <div className="space-y-1.5">
          <button
            onClick={() => onFilterChange('source', '')}
            className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-all`}
            style={{
              background: !filters.source ? 'var(--primary-glow)' : 'transparent',
              color: !filters.source ? 'var(--primary-bright)' : 'var(--foreground-muted)',
              border: !filters.source ? '1px solid var(--border-glow)' : '1px solid transparent',
            }}
          >
            All Sources
          </button>
          {SOURCES.map(s => (
            <button
              key={`filter-source-${s}`}
              onClick={() => onFilterChange('source', s === filters.source ? '' : s)}
              className="w-full text-left text-sm px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: filters.source === s ? 'var(--primary-glow)' : 'transparent',
                color: filters.source === s ? 'var(--primary-bright)' : 'var(--foreground-muted)',
                border: filters.source === s ? '1px solid var(--border-glow)' : '1px solid transparent',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Batch */}
      {batches.length > 0 && (
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>
            Batch
          </label>
          <select
            value={filters.batch ?? ''}
            onChange={e => onFilterChange('batch', e.target.value)}
            className="select-field text-sm py-2 w-full"
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={`filter-batch-${b}`} value={b}>{b}</option>
            ))}
          </select>
        </div>
      )}

      {/* Genre */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>
          Genre
        </label>
        <select
          value={filters.genre}
          onChange={e => onFilterChange('genre', e.target.value)}
          className="select-field text-sm py-2 w-full"
        >
          <option value="">All Genres</option>
          {genres.map(g => (
            <option key={`filter-genre-${g}`} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Tropes — multi-select with ALL/ANY toggle */}
      {tropes.length > 0 && (
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>
            Tropes
            {selectedTropes.length > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: 'var(--primary-glow)', color: 'var(--primary-bright)', border: '1px solid var(--border-glow)' }}
              >
                {selectedTropes.length}
              </span>
            )}
          </label>

          {/* ALL / ANY toggle — only shown when 2+ tropes selected */}
          {selectedTropes.length >= 2 && (
            <div className="flex items-center gap-1 mb-2 p-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.08)' }}>
              <button
                onClick={() => handleTropeMatchMode('any')}
                className="flex-1 text-xs py-1 rounded-md font-semibold transition-all"
                style={{
                  background: tropeMatchMode === 'any' ? 'var(--primary-glow)' : 'transparent',
                  color: tropeMatchMode === 'any' ? 'var(--primary-bright)' : 'var(--foreground-subtle)',
                  border: tropeMatchMode === 'any' ? '1px solid var(--border-glow)' : '1px solid transparent',
                }}
              >
                Any
              </button>
              <button
                onClick={() => handleTropeMatchMode('all')}
                className="flex-1 text-xs py-1 rounded-md font-semibold transition-all"
                style={{
                  background: tropeMatchMode === 'all' ? 'var(--primary-glow)' : 'transparent',
                  color: tropeMatchMode === 'all' ? 'var(--primary-bright)' : 'var(--foreground-subtle)',
                  border: tropeMatchMode === 'all' ? '1px solid var(--border-glow)' : '1px solid transparent',
                }}
              >
                All
              </button>
            </div>
          )}

          {/* Helper text */}
          {selectedTropes.length >= 2 && (
            <p className="text-xs mb-2" style={{ color: 'var(--foreground-subtle)', lineHeight: 1.4 }}>
              {tropeMatchMode === 'any' ?'Showing titles with at least one selected trope' :'Showing titles with all selected tropes'}
            </p>
          )}

          {/* Trope checkboxes */}
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {tropes.map(t => {
              const checked = selectedTropes.includes(t);
              return (
                <label
                  key={`filter-trope-${t}`}
                  className="flex items-center gap-2 cursor-pointer group py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleTropeToggle(t)}
                    className="rounded"
                    style={{
                      accentColor: 'var(--primary-bright)',
                      width: '14px',
                      height: '14px',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  />
                  <span
                    className="text-xs leading-snug transition-colors"
                    style={{ color: checked ? 'var(--primary-bright)' : 'var(--foreground-muted)' }}
                  >
                    {t}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Clear tropes */}
          {selectedTropes.length > 0 && (
            <button
              onClick={() => onFilterChange('selectedTropes', [])}
              className="mt-2 text-xs transition-colors"
              style={{ color: 'var(--foreground-subtle)' }}
            >
              Clear tropes
            </button>
          )}
        </div>
      )}

      {/* Author */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>
          Author
        </label>
        <select
          value={filters.author ?? ''}
          onChange={e => onFilterChange('author', e.target.value)}
          className="select-field text-sm py-2 w-full"
        >
          <option value="">All Authors</option>
          {authors.map(a => (
            <option key={`filter-author-${a}`} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Format */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>
          Format
        </label>
        <select
          value={filters.format}
          onChange={e => onFilterChange('format', e.target.value)}
          className="select-field text-sm py-2 w-full"
        >
          <option value="">All Formats</option>
          {formats.map(f => (
            <option key={`filter-format-${f}`} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>
          Availability
        </label>
        <div className="space-y-1.5">
          <button
            onClick={() => onFilterChange('status', '')}
            className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-all ${
              !filters.status ? 'font-medium' : ''
            }`}
            style={{
              background: !filters.status ? 'var(--primary-glow)' : 'transparent',
              color: !filters.status ? 'var(--primary-bright)' : 'var(--foreground-muted)',
              border: !filters.status ? '1px solid var(--border-glow)' : '1px solid transparent',
            }}
          >
            All Statuses
          </button>
          {STATUSES.map(s => (
            <button
              key={`filter-status-${s}`}
              onClick={() => onFilterChange('status', s === filters.status ? '' : s)}
              className="w-full text-left text-sm px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: filters.status === s ? 'var(--primary-glow)' : 'transparent',
                color: filters.status === s ? 'var(--primary-bright)' : 'var(--foreground-muted)',
                border: filters.status === s ? '1px solid var(--border-glow)' : '1px solid transparent',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>
          Price Range (₱)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={priceMin}
            onChange={e => onPriceChange(e.target.value, priceMax)}
            className="input-field text-sm py-2 w-full"
            style={{ minWidth: 0 }}
          />
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--foreground-subtle)' }}>–</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={priceMax}
            onChange={e => onPriceChange(priceMin, e.target.value)}
            className="input-field text-sm py-2 w-full"
            style={{ minWidth: 0 }}
          />
        </div>
      </div>
    </div>
  );
}