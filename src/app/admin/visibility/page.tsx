import React from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminVisibilityContent from './components/AdminVisibilityContent';

export const metadata = { title: "Visibility Control — Admin" };

export default function AdminVisibilityPage() {
  return (
    <AdminGuard>
      <AdminVisibilityContent />
    </AdminGuard>
  );
}
