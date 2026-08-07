import React from 'react';
import AdminGuard from '@/app/admin/components/AdminGuard';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminAnnouncementsContent from './components/AdminAnnouncementsContent';

export default function AdminAnnouncementsPage() {
  return (
    <AdminGuard>
      <AdminLayout title="Announcements">
        <AdminAnnouncementsContent />
      </AdminLayout>
    </AdminGuard>
  );
}
