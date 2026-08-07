'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { Book } from '@/lib/types';

interface FeaturedBook {
  id: string;
  book_id: string;
  sort_order: number;
  book?: Book;
}

function FeaturedBooksContent() {
  const [featured, setFeatured] = useState<FeaturedBook[]>([]);
  const [topRated, setTopRated] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Load top-rated books (auto-pulled by goodreads_score)
      const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('is_visible', true)
        .not('goodreads_score', 'is', null)
        .order('goodreads_score', { ascending: false })
        .limit(12);
      setTopRated((books ?? []) as unknown as Book[]);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold" style={{ color: 'var(--foreground)' }}>Featured Books</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
          Auto-pulled by top Goodreads rating. These books appear in the Featured section on the homepage when present.
        </p>
      </div>

      <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Icon name="StarIcon" size={16} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
          <span className="text-sm font-semibold" style={{ color: 'var(--primary-bright)' }}>Auto-Populated</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
          Featured Books are automatically pulled from your inventory sorted by Goodreads score (highest first). The section only renders on the homepage when there are books with a Goodreads score. To control which books appear, update their Goodreads scores in Book Detail Management.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : topRated.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <Icon name="StarIcon" size={40} className="mx-auto mb-4" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>No books with Goodreads scores yet.</p>
          <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Add Goodreads scores to books in Book Detail Management to populate this section.</p>
        </div>
      ) : (
        <>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            <strong style={{ color: 'var(--foreground)' }}>{topRated.length}</strong> books will appear in Featured Books (sorted by rating)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {topRated.map((book, idx) => (
              <div key={book.id} className="rounded-xl overflow-hidden" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                <div className="relative aspect-[2/3]">
                  <AppImage src={(book as Record<string, unknown>).cover_url as string || '/assets/images/no_image.png'} alt={`Cover of ${(book as Record<string, unknown>).title as string}`} fill sizes="200px" className="object-cover" />
                  <div className="absolute top-2 left-2">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.9)', color: '#fff' }}>#{idx + 1}</span>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>{(book as Record<string, unknown>).title as string}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>{(book as Record<string, unknown>).author as string}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Icon name="StarIcon" size={10} style={{ color: '#f59e0b' } as React.CSSProperties} />
                    <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>{Number((book as Record<string, unknown>).goodreads_score).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminFeaturedPage() {
  return (
    <AdminGuard>
      <AdminLayout title="Featured Books">
        <FeaturedBooksContent />
      </AdminLayout>
    </AdminGuard>
  );
}
