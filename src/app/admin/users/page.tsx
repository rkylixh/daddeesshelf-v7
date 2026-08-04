import React from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminUsersContent from './components/AdminUsersContent';

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminUsersContent />
    </AdminGuard>
  );
}
