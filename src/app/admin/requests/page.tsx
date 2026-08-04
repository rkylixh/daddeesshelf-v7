import React from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminRequestsContent from './components/AdminRequestsContent';

export const metadata = { title: "Title Requests — Admin" };

export default function AdminRequestsPage() {
  return (
    <AdminGuard>
      <AdminRequestsContent />
    </AdminGuard>
  );
}
