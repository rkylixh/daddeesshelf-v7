'use client';

import React from 'react';
import { BookFilters } from '@/lib/types';

interface Props {
  filters: BookFilters;
  genres: string[];
  formats: string[];
  onFilterChange: (key: keyof BookFilters, value: string) => void;
  onClear: () => void;
  activeCount: number;
}

const STATUSES = ['Pre-order', 'On Hand', 'Sold Out'];

export default function ShopFilters({ filters, genres, formats, onFilterChange, onClear, activeCount }: Props) {
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

      {/* Series */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>
          Series
        </label>
        <input
          type="text"
          placeholder="Filter by series..."
          value={filters.series}
          onChange={e => onFilterChange('series', e.target.value)}
          className="input-field text-sm py-2"
        />
      </div>
    </div>
  );
}