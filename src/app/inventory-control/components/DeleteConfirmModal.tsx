'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { Book } from '@/lib/types';

interface Props {
  book: Book;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ book, onConfirm, onCancel }: Props) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
      <div className="modal-content w-full max-w-md mx-4 p-6">
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <Icon name="TrashIcon" size={18} style={{ color: '#ef4444' } as React.CSSProperties} />
          </div>
          <div>
            <h2 id="delete-modal-title" className="font-display text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>
              Delete Book
            </h2>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              This will permanently remove this title from your inventory. This action cannot be undone.
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-3 mb-6 flex items-center gap-3"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{book.title}</p>
            <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
              {book.author} · {book.sku} · {book.format}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 btn-ghost py-2.5 rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(239,68,68,0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            Delete Book
          </button>
        </div>
      </div>
    </div>
  );
}