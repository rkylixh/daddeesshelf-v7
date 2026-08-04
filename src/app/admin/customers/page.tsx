'use client';

import React from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminCustomersContent from './components/AdminCustomersContent';

export default function AdminCustomersPage() {
  return (
    <AdminGuard>
      <AdminCustomersContent />
    </AdminGuard>
  );
}
