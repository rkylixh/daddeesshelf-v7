import React from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminFAQsContent from './components/AdminFAQsContent';

export const metadata = { title: "FAQ Management — Admin" };

export default function AdminFAQsPage() {
  return (
    <AdminGuard>
      <AdminFAQsContent />
    </AdminGuard>
  );
}
