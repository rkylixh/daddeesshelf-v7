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
        background: '#2C1A0E',
        border: '1px solid rgba(200,164,91,0.4)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(200,164,91,0.8)' }}>
        You can search by:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {hints.map(({ label, icon }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
            style={{
              background: 'rgba(200,164,91,0.15)',
              color: '#C8A45B',
              border: '1px solid rgba(200,164,91,0.35)',
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
