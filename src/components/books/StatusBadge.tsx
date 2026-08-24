import React from 'react';
import { BookStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: BookStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cls =
    status === 'Pre-order' ? 'badge-preorder'
      : status === 'On Hand'? 'badge-onhand' :'badge-soldout';

  const icon =
    status === 'Pre-order' ? '✦ '
      : status === 'On Hand'? '● ' :'✕ ';

  const soldOutStyle: React.CSSProperties =
    status === 'Sold Out'
      ? {
          fontSize: size === 'sm' ? '0.65rem' : '0.72rem',
          padding: size === 'sm' ? '0.2rem 0.55rem' : '0.25rem 0.65rem',
          background: 'rgba(220,38,38,0.18)',
          color: '#b91c1c',
          border: '1.5px solid rgba(220,38,38,0.6)',
          fontWeight: 700,
          letterSpacing: '0.06em',
          boxShadow: '0 0 8px rgba(220,38,38,0.2)',
        }
      : status === 'Pre-order'
      ? {
          fontSize: size === 'sm' ? '0.65rem' : '0.72rem',
          padding: size === 'sm' ? '0.2rem 0.55rem' : '0.25rem 0.65rem',
          background: 'rgba(200,140,30,0.22)',
          color: '#7C4F00',
          border: '1.5px solid rgba(180,120,20,0.6)',
          fontWeight: 700,
          letterSpacing: '0.06em',
        }
      : size === 'sm'
      ? { fontSize: '0.65rem', padding: '0.2rem 0.5rem' }
      : {};

  return (
    <span className={cls} style={soldOutStyle}>
      {icon}{status}
    </span>
  );
}