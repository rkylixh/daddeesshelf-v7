import React from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminLayout from '../components/AdminLayout';

export default function AdminGenresPage() {
  return (
    <AdminGuard>
      <AdminLayout title="Genre Management">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-6" aria-hidden="true">✦</span>
          <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>Genre Management</h2>
          <p className="text-sm max-w-sm" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>Manage genres, subgenres, icons, and colors for the storefront genre grid.</p>
          <div className="mt-6 px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--primary-bright)', border: '1px solid rgba(139,92,246,0.3)' }}>
            Coming in next revision
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
