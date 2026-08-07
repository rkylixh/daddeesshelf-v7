'use client';

import React from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminLayout from '../components/AdminLayout';
import AdminOnHandContent from './components/AdminOnHandContent';

export default function AdminOnHandPage() {
  return (
    <AdminGuard>
      <AdminLayout title="On Hand Inventory">
        <AdminOnHandContent />
      </AdminLayout>
    </AdminGuard>
  );
}
