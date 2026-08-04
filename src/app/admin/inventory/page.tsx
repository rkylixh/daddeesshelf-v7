import React from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminInventoryContent from './components/AdminInventoryContent';

export const metadata = { title: "Inventory Control — Admin" };

export default function AdminInventoryPage() {
  return (
    <AdminGuard>
      <AdminInventoryContent />
    </AdminGuard>
  );
}
