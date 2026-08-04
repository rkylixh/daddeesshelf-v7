'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Props {
  selectedCount: number;
  genres: string[];
  batches: string[];
  onBulkAction: (action: 'genre' | 'batch' | 'status', value: string) => void;
  onClearSelection: () => void;
}

const STATUSES = ['Pre-order', 'On Hand', 'Sold Out'];

export default function BulkActionsBar({ selectedCount, genres, batches, onBulkAction, onClearSelection }: Props) {
  const [activeAction, setActiveAction] = useState<'genre' | 'batch' | 'status' | null>(null);
  const [selectedValue, setSelectedValue] = useState('');

  const handleApply = () => {
    if (!activeAction || !selectedValue) return;
    onBulkAction(activeAction, selectedValue);
    setActiveAction(null);
    setSelectedValue('');
  };

  const options =
    activeAction === 'genre'
      ? genres
      : activeAction === 'batch'
      ? batches
      : STATUSES;

  return (
    <div
      className="rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3 animate-fade-in"
      style={{
        background: 'rgba(139,92,246,0.1)',
        border: '1px solid rgba(139,92,246,0.3)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          {selectedCount}
        </span>
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {selectedCount === 1 ? 'book' : 'books'} selected
        </span>
      </div>

      <div className="h-4 w-px mx-1" style={{ background: 'rgba(139,92,246,0.4)' }} />

      {/* Bulk action buttons */}
      {(['genre', 'batch', 'status'] as const).map(action => (
        <button
          key={`bulk-action-${action}`}
          onClick={() => {
            setActiveAction(activeAction === action ? null : action);
            setSelectedValue('');
          }}
          className="text-sm px-3 py-1.5 rounded-lg font-medium transition-all"
          style={{
            background: activeAction === action ? 'var(--primary)' : 'rgba(139,92,246,0.15)',
            color: activeAction === action ? 'white' : 'var(--primary-bright)',
            border: `1px solid ${activeAction === action ? 'var(--primary)' : 'rgba(139,92,246,0.3)'}`,
          }}
        >
          Change {action.charAt(0).toUpperCase() + action.slice(1)}
        </button>
      ))}

      {/* Value selector */}
      {activeAction && (
        <div className="flex items-center gap-2 animate-fade-in">
          <select
            value={selectedValue}
            onChange={e => setSelectedValue(e.target.value)}
            className="select-field text-sm py-1.5 px-3"
            autoFocus
          >
            <option value="">Select {activeAction}...</option>
            {options.map(opt => (
              <option key={`bulk-opt-${opt}`} value={opt}>{opt}</option>
            ))}
          </select>
          <button
            onClick={handleApply}
            disabled={!selectedValue}
            className="btn-primary text-sm px-4 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
          <button
            onClick={() => { setActiveAction(null); setSelectedValue(''); }}
            className="btn-ghost text-sm px-2 py-1.5"
          >
            <Icon name="XMarkIcon" size={14} />
          </button>
        </div>
      )}

      <button
        onClick={onClearSelection}
        className="ml-auto btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
        style={{ color: 'var(--foreground-subtle)' }}
      >
        <Icon name="XMarkIcon" size={13} />
        Clear selection
      </button>
    </div>
  );
}