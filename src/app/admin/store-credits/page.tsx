'use client';

import React from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminStoreCreditsContent from './components/AdminStoreCreditsContent';

export default function AdminStoreCreditsPage() {
  return (
    <AdminGuard>
      <AdminStoreCreditsContent />
    </AdminGuard>
  );
}
