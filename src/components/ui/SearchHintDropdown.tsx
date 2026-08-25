'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

export interface SearchHint {
  label: string;
  icon: string;
}

export const BOOK_SEARCH_HINTS: SearchHint[] = [
  { label: 'Title', icon: 'BookOpenIcon' },
  { label: 'Book Code', icon: 'HashtagIcon' },
  { label: 'Tropes', icon: 'TagIcon' },
  { label: 'Genre', icon: 'SparklesIcon' },
  { label: 'Author', icon: 'UserIcon' },
];

interface Props {
  hints: SearchHint[];
}

export default function SearchHintDropdown({ hints }: Props) {
  return (
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
        {hints.map(({ label, icon }) => (
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
  );
}
