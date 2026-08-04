import React from 'react';
import { BookStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: BookStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cls =
    status === 'Pre-order' ?'badge-preorder'
      : status === 'On Hand' ?'badge-onhand' :'badge-soldout';

  const icon =
    status === 'Pre-order' ? '✦ ' : status === 'On Hand' ? '● ' : '○ ';

  return (
    <span
      className={cls}
      style={size === 'sm' ? { fontSize: '0.65rem', padding: '0.2rem 0.5rem' } : {}}
    >
      {icon}{status}
    </span>
  );
}