import React from 'react';
import { BookStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: BookStatus;
  size?: 'sm' | 'md';
  available?: number;
}

export default function StatusBadge({ status, size = 'md', available }: StatusBadgeProps) {
  const cls =
    status === 'Pre-order' ? 'badge-preorder'
      : status === 'On Hand'? 'badge-onhand' :'badge-soldout';

  const icon =
    status === 'Pre-order' ? '✦ '
      : status === 'On Hand'? '● ' :'✕ ';

  // Determine pre-order badge color based on stock availability
  const getPreorderStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      fontSize: size === 'sm' ? '0.68rem' : '0.75rem',
      padding: size === 'sm' ? '0.25rem 0.6rem' : '0.3rem 0.7rem',
      fontWeight: 800,
      letterSpacing: '0.08em',
      boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
      borderRadius: '6px',
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
    };

    // If available is provided, color-code by stock level
    if (available !== undefined) {
      if (available <= 0) {
        // Sold out — red
        return {
          ...baseStyle,
          background: 'rgba(100, 10, 10, 0.90)',
          color: '#FFD6D6',
          border: '1.5px solid rgba(220,80,80,0.7)',
        };
      } else if (available <= 2) {
        // Low stock (1–2) — red
        return {
          ...baseStyle,
          background: 'rgba(180, 20, 20, 0.92)',
          color: '#FFD6D6',
          border: '1.5px solid rgba(220,60,60,0.85)',
        };
      } else if (available <= 4) {
        // Medium stock (3–4) — blue
        return {
          ...baseStyle,
          background: 'rgba(10, 50, 120, 0.90)',
          color: '#D6E8FF',
          border: '1.5px solid rgba(80,150,255,0.7)',
        };
      } else {
        // High stock (5+) — green
        return {
          ...baseStyle,
          background: 'rgba(10, 80, 30, 0.90)',
          color: '#D6FFE8',
          border: '1.5px solid rgba(34,197,94,0.7)',
        };
      }
    }

    // Default amber (no available info)
    return {
      ...baseStyle,
      background: 'rgba(120, 60, 0, 0.88)',
      color: '#FFF3D6',
      border: '1.5px solid rgba(255,200,80,0.7)',
    };
  };

  const soldOutStyle: React.CSSProperties =
    status === 'Sold Out'
      ? {
          fontSize: size === 'sm' ? '0.65rem' : '0.72rem',
          padding: size === 'sm' ? '0.2rem 0.55rem' : '0.25rem 0.65rem',
          background: 'rgba(15, 15, 15, 0.92)',
          color: '#E0E0E0',
          border: '1.5px solid rgba(80,80,80,0.7)',
          fontWeight: 800,
          letterSpacing: '0.08em',
          boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
          borderRadius: '6px',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }
      : status === 'Pre-order'
      ? getPreorderStyle()
      : size === 'sm'
      ? { fontSize: '0.65rem', padding: '0.2rem 0.5rem' }
      : {};

  return (
    <span className={cls} style={soldOutStyle}>
      {icon}{status}
    </span>
  );
}