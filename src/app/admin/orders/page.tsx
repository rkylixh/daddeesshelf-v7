import React from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminOrdersContent from './components/AdminOrdersContent';

export const metadata = { title: "Order Management — Admin" };

export default function AdminOrdersPage() {
  return (
    <AdminGuard>
      <AdminOrdersContent />
    </AdminGuard>
  );
}
