'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminGuard from '../components/AdminGuard';
import AdminLayout from '../components/AdminLayout';

function PreordersRedirectContent() {
  const router = useRouter();
  React.useEffect(() => {
    router?.replace('/admin/orders');
  }, [router]);

  return (
    <AdminLayout title="Preorder Management">
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: 'var(--primary)' }} />
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Redirecting to Order Management...</p>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminPreordersPage() {
  return (
    <AdminGuard>
      <PreordersRedirectContent />
    </AdminGuard>
  );
}
