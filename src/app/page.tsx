'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HomeHero from './components/HomeHero';
import HomeCelestialDivider from './components/HomeCelestialDivider';
import BookGrid from '@/components/books/BookGrid';
import { getBooks } from '@/lib/books';
import { Book } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Icon from '@/components/ui/AppIcon';

interface BatchInfo {
  name: string;
  eta: string | null;
  count: number;
}

export default function HomePage() {
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [batchBooks, setBatchBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // FIFO: get all distinct batches from pre-order books, pick the earliest arrival_date batch
        const { data: batchRows } = await supabase
          .from('books')
          .select('batch, arrival_date')
          .eq('is_visible', true)
          .not('arrival_date', 'is', null)
          .order('arrival_date', { ascending: true });

        if (!batchRows || batchRows.length === 0) {
          setLoading(false);
          return;
        }

        // Find earliest batch (FIFO)
        const now = new Date();
        // Filter to future/upcoming arrival dates only (pre-order books)
        const futureBatches = batchRows.filter(r => r.arrival_date && new Date(r.arrival_date) > now);
        
        let activeBatchName: string | null = null;
        let activeBatchEta: string | null = null;

        if (futureBatches.length > 0) {
          activeBatchName = futureBatches[0].batch;
          activeBatchEta = futureBatches[0].arrival_date;
        } else {
          // Fallback: use the most recent batch
          activeBatchName = batchRows[batchRows.length - 1].batch;
          activeBatchEta = batchRows[batchRows.length - 1].arrival_date;
        }

        if (!activeBatchName) { setLoading(false); return; }

        // Get all books in this batch
        const books = await getBooks({ batch: activeBatchName });
        const preorderBooks = books.filter(b => b.status === 'Pre-order');

        setBatchInfo({
          name: activeBatchName,
          eta: activeBatchEta,
          count: preorderBooks.length,
        });
        setBatchBooks(preorderBooks.slice(0, 6));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatEta = (dateStr: string | null) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-16">
        <HomeHero />

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
          </div>
        ) : batchInfo ? (
          <>
            <HomeCelestialDivider label="✦ Current Import Batch ✦" />

            {/* Batch Info Banner */}
            <section className="content-wrapper mb-8">
              <div
                className="rounded-2xl p-6 mb-8"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(79,70,229,0.08))',
                  border: '1px solid rgba(139,92,246,0.3)',
                }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--primary)', letterSpacing: '0.15em' }}>
                      ✦ Now Open for Preorder
                    </p>
                    <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                      {batchInfo.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Icon name="CalendarIcon" size={14} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
                        <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                          ETA: <strong style={{ color: 'var(--foreground)' }}>{formatEta(batchInfo.eta)}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon name="BookOpenIcon" size={14} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
                        <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                          <strong style={{ color: 'var(--foreground)' }}>{batchInfo.count}</strong> titles available
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/shop?batch=${encodeURIComponent(batchInfo.name)}`}
                    className="btn-primary text-sm px-6 py-2.5 flex-shrink-0"
                  >
                    Browse Current Batch ✦
                  </Link>
                </div>
              </div>

              {/* Batch books preview */}
              {batchBooks.length > 0 && (
                <>
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <h3 className="font-display text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                        Titles in This Batch
                      </h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                        Reserve your copy before the batch closes
                      </p>
                    </div>
                    <Link
                      href={`/shop?batch=${encodeURIComponent(batchInfo.name)}`}
                      className="text-sm font-medium flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--primary-bright)' }}
                    >
                      View all →
                    </Link>
                  </div>
                  <BookGrid books={batchBooks} />
                </>
              )}
            </section>
          </>
        ) : (
          <section className="content-wrapper py-16 text-center">
            <span className="text-4xl mb-4 block" aria-hidden="true">✦</span>
            <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              No Active Batch Right Now
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
              Check back soon — new import batches are announced regularly.
            </p>
            <Link href="/shop" className="btn-primary text-sm px-8 py-3 inline-block">
              Browse All Books ✦
            </Link>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}