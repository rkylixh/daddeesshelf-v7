'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { Book } from '@/lib/types';

function FreshPicksContent() {
  const [freshPicks, setFreshPicks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(12);
      setFreshPicks((data ?? []) as unknown as Book[]);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold" style={{ color: 'var(--foreground)' }}>Fresh Picks</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
          Auto-pulled by newest arrival date. These books appear in the Fresh Picks section on the homepage when present.
        </p>
      </div>

      <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Icon name="SparklesIcon" size={16} style={{ color: '#10b981' } as React.CSSProperties} />
          <span className="text-sm font-semibold" style={{ color: '#10b981' }}>Auto-Populated</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
          Fresh Picks are automatically pulled from your inventory sorted by newest addition date. The section only renders on the homepage when books are present. The most recently added visible books appear here.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : freshPicks.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <Icon name="SparklesIcon" size={40} className="mx-auto mb-4" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>No books in inventory yet.</p>
        </div>
      ) : (
        <>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Showing <strong style={{ color: 'var(--foreground)' }}>{freshPicks.length}</strong> most recently added books
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {freshPicks.map((book, idx) => (
              <div key={(book as Record<string, unknown>).id as string} className="rounded-xl overflow-hidden" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                <div className="relative aspect-[2/3]">
                  <AppImage src={(book as Record<string, unknown>).cover_url as string || '/assets/images/no_image.png'} alt={`Cover of ${(book as Record<string, unknown>).title as string}`} fill sizes="200px" className="object-cover" />
                  <div className="absolute top-2 left-2">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.9)', color: '#fff' }}>#{idx + 1}</span>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>{(book as Record<string, unknown>).title as string}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>{(book as Record<string, unknown>).author as string}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                    Added {new Date((book as Record<string, unknown>).created_at as string).toLocaleDateString('en-PH')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminFreshPicksPage() {
  return (
    <AdminGuard>
      <AdminLayout title="Fresh Picks">
        <FreshPicksContent />
      </AdminLayout>
    </AdminGuard>
  );
}
