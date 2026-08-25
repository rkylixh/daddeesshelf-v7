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
          fontSize: size === 'sm' ? '0.68rem' : '0.75rem',
          padding: size === 'sm' ? '0.25rem 0.6rem' : '0.3rem 0.7rem',
          background: 'rgba(120, 60, 0, 0.88)',
          color: '#FFF3D6',
          border: '1.5px solid rgba(255,200,80,0.7)',
          fontWeight: 800,
          letterSpacing: '0.08em',
          boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
          borderRadius: '6px',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
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