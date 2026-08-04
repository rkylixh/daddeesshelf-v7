'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('admin_session');
      if (!raw) {
        router.replace('/admin/login');
        return;
      }
      const session = JSON.parse(raw);
      if (!session?.id || !session?.authenticated_at) {
        router.replace('/admin/login');
        return;
      }
      // Optional: expire session after 8 hours
      const eightHours = 8 * 60 * 60 * 1000;
      if (Date.now() - session.authenticated_at > eightHours) {
        sessionStorage.removeItem('admin_session');
        router.replace('/admin/login');
        return;
      }
      setChecking(false);
    } catch {
      router.replace('/admin/login');
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--primary)' }}
          />
          <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
