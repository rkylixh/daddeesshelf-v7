'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/admin/login');
        return;
      }
      const role = session.user?.user_metadata?.role ?? session.user?.app_metadata?.role;
      if (role !== 'admin') {
        router.replace('/admin/login');
        return;
      }
      setChecking(false);
    });
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
