'use client';

import React from 'react';

interface Props {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  pageSizeOptions: number[];
}

export default function ShopPagination({ page, totalPages, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions }: Props) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
      <p className="text-sm" style={{ color: 'var(--foreground-subtle)' }}>
        Showing {start}–{end} of {total} titles
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="btn-ghost px-3 py-1.5 text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`page-ellipsis-${i}`} className="px-2 text-sm" style={{ color: 'var(--foreground-subtle)' }}>
              …
            </span>
          ) : (
            <button
              key={`page-${p}`}
              onClick={() => onPageChange(p as number)}
              className="w-8 h-8 text-sm rounded-lg font-medium transition-all"
              style={{
                background: page === p ? 'var(--primary)' : 'transparent',
                color: page === p ? 'white' : 'var(--foreground-muted)',
                border: page === p ? 'none' : '1px solid transparent',
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="btn-ghost px-3 py-1.5 text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Per page:</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="select-field text-sm py-1.5 px-3"
        >
          {pageSizeOptions.map(s => (
            <option key={`pagesize-${s}`} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}