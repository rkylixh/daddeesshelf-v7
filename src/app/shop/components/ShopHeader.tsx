'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Props {
  totalCount: number;
  sort: string;
  onSortChange: (val: any) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  search: string;
  onSearchChange: (val: string) => void;
}

export default function ShopHeader({
  totalCount,
  sort,
  onSortChange,
  filtersOpen,
  onToggleFilters,
  activeFilterCount,
  search,
  onSearchChange,
}: Props) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div>
      {/* Title row */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            The Shelf
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
            {totalCount} {totalCount === 1 ? 'title' : 'titles'} available
          </p>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Icon
            name="MagnifyingGlassIcon"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties}
          />
          <input
            type="search"
            placeholder="Search title, book code, tropes, genre..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="input-field pl-9 pr-4 py-2 text-sm"
          />
          {/* Search hint dropdown */}
          {searchFocused && (
            <div
              className="absolute left-0 right-0 top-full mt-1 rounded-lg z-30 py-2 px-3"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 24px rgba(30,18,10,0.18)',
              }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>
                You can search by:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Title', icon: 'BookOpenIcon' },
                  { label: 'Book Code', icon: 'HashtagIcon' },
                  { label: 'Tropes', icon: 'TagIcon' },
                  { label: 'Genre', icon: 'SparklesIcon' },
                ].map(({ label, icon }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{
                      background: 'var(--primary-glow)',
                      color: 'var(--primary-bright)',
                      border: '1px solid rgba(200,164,91,0.25)',
                    }}
                  >
                    <Icon name={icon as any} size={11} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filter toggle (mobile/tablet) */}
        <button
          onClick={onToggleFilters}
          className="lg:hidden btn-ghost flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
          style={{
            border: '1px solid var(--border)',
            background: filtersOpen ? 'var(--primary-glow)' : 'transparent',
            color: filtersOpen ? 'var(--primary-bright)' : 'var(--foreground-muted)',
          }}
        >
          <Icon name="AdjustmentsHorizontalIcon" size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Sort:</span>
          <select
            value={sort}
            onChange={e => onSortChange(e.target.value)}
            className="select-field text-sm py-2 pl-3 pr-8"
          >
            <option value="newest">Newest First</option>
            <option value="title-asc">Title A–Z</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
}