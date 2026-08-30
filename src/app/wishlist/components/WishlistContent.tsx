'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { getBooks, formatBookPrice } from '@/lib/books';
import { Book } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

const WISHLIST_KEY = 'ds-wishlist';

function getWishlistIds(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? '[]'); } catch { return []; }
}

function removeFromWishlist(id: string) {
  const current = getWishlistIds();
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(current.filter(i => i !== id)));
}

interface TitleRequest {
  id: string;
  ref_number: string;
  requested_title: string;
  requested_author: string;
  notes: string;
  status: string;
  admin_notes: string;
  owner_notes: string;
  created_at: string;
}

const REQUEST_STATUS_COLORS: Record<string, string> = {
  'Pending': '#f59e0b',
  'Noted': '#3b82f6',
  'Added to Batch': '#10b981',
  'Declined': '#6b7280',
};

export default function WishlistContent() {
  const { customer, isLoggedIn } = useCustomerAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [titleRequests, setTitleRequests] = useState<TitleRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    const ids = getWishlistIds();
    setWishlistIds(ids);
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    async function loadBooks() {
      const all = await getBooks({});
      setBooks(all.filter(b => ids.includes(b.id)));
      setLoading(false);
    }
    loadBooks();
  }, []);

  // Load title requests for logged-in customer
  useEffect(() => {
    if (!isLoggedIn || !customer?.tiktokHandle) return;
    const loadRequests = async () => {
      setRequestsLoading(true);
      try {
        const supabase = createClient();
        const rawHandle = customer.tiktokHandle.replace(/^@/, '');
        const normalizedHandle = '@' + rawHandle;
        const { data } = await supabase
          .from('title_requests')
          .select('id, ref_number, requested_title, requested_author, notes, status, admin_notes, owner_notes, created_at')
          .in('tiktok_handle', [normalizedHandle, rawHandle])
          .order('created_at', { ascending: false });
        setTitleRequests((data ?? []) as TitleRequest[]);
      } catch {
        // non-blocking
      } finally {
        setRequestsLoading(false);
      }
    };
    loadRequests();
  }, [isLoggedIn, customer]);

  const handleRemove = (id: string) => {
    removeFromWishlist(id);
    setBooks(prev => prev.filter(b => b.id !== id));
    setWishlistIds(prev => prev.filter(i => i !== id));
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  };

  return (
    <div className="content-wrapper py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Saved Titles ✦
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: '#3A2214' }}>
          My Wishlist
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: '#6B5040', lineHeight: '1.7' }}>
          Books you&apos;ve saved for later. Your wishlist persists across visits until you remove a title.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : books.length === 0 ? (
        <div className="max-w-lg mx-auto space-y-6">
          {/* Empty wishlist card */}
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: 'rgba(251,245,236,0.7)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}
          >
            <span className="text-5xl mb-6 block" aria-hidden="true" style={{ color: '#7B6454' }}>♡</span>
            <h2 className="font-display text-xl font-bold mb-3" style={{ color: '#3A2214' }}>
              Your wishlist is empty
            </h2>
            <p className="text-sm mb-6" style={{ color: '#6B5040', lineHeight: '1.7' }}>
              Browse our collection and tap the heart icon on any book to save it here.
            </p>
            <Link href="/shop" className="btn-primary text-sm px-6 py-2.5 inline-block">
              Browse Books
            </Link>
          </div>

          {/* Request a Title — always visible */}
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(251,245,236,0.7)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
              ✦ Can&apos;t find what you&apos;re looking for? ✦
            </p>
            <h3 className="font-display text-xl font-bold mb-2" style={{ color: '#3A2214' }}>
              Request a Title
            </h3>
            <p className="text-sm mb-5 max-w-sm mx-auto" style={{ color: '#6B5040', lineHeight: '1.7' }}>
              Don&apos;t see the book you want? Send us a request and we&apos;ll do our best to source it for you.
            </p>
            <Link href="/request" className="btn-primary text-sm px-6 py-2.5 inline-block">
              Request a Title
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm mb-6" style={{ color: '#6B5040' }}>
            {books.length} {books.length === 1 ? 'title' : 'titles'} saved
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {books.map(book => (
              <div
                key={book.id}
                className="rounded-xl overflow-hidden group relative"
                style={{ background: 'rgba(251,245,236,0.25)', border: '1px solid rgba(216,196,168,0.5)', backdropFilter: 'blur(6px)', boxShadow: '0 2px 12px rgba(75,53,42,0.08)' }}
              >
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(book.id)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ background: 'rgba(243,231,213,0.9)', border: '1px solid var(--border)' }}
                  title="Remove from wishlist"
                >
                  <Icon name="XMarkIcon" size={14} style={{ color: '#4B352A' } as React.CSSProperties} />
                </button>

                <Link href={`/book-detail?id=${book.id}`}>
                  <div className="relative aspect-[2/3]">
                    <AppImage
                      src={book.cover_url || '/assets/images/no_image.png'}
                      alt={`Cover of ${book.title} by ${book.author}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3" style={{ background: 'rgba(251,245,236,0.15)' }}>
                    <p className="text-xs font-semibold leading-snug mb-0.5 line-clamp-2" style={{ color: '#3A2214' }}>
                      {book.title}
                    </p>
                    <p className="text-xs italic mb-1" style={{ color: '#6B5040' }}>
                      {book.author}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold tabular-nums" style={{ color: '#8B6A20' }}>
                        {formatBookPrice(book)}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          background: book.status === 'On Hand' ? 'rgba(16,185,129,0.15)' : 'rgba(200,164,91,0.15)',
                          color: book.status === 'On Hand' ? '#1a6b4a' : '#7A5A20',
                          border: `1px solid ${book.status === 'On Hand' ? 'rgba(16,185,129,0.35)' : 'rgba(200,164,91,0.35)'}`,
                        }}
                      >
                        {book.status}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Request a Title CTA */}
          <div
            className="mt-10 rounded-2xl p-8 text-center"
            style={{ background: 'rgba(251,245,236,0.7)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
              ✦ Can&apos;t find what you&apos;re looking for? ✦
            </p>
            <h3 className="font-display text-xl font-bold mb-2" style={{ color: '#3A2214' }}>
              Request a Title
            </h3>
            <p className="text-sm mb-5 max-w-sm mx-auto" style={{ color: '#6B5040', lineHeight: '1.7' }}>
              Don&apos;t see the book you want? Send us a request and we&apos;ll do our best to source it for you.
            </p>
            <Link href="/request" className="btn-primary text-sm px-6 py-2.5 inline-block">
              Request a Title
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link href="/shop" className="btn-secondary text-sm px-6 py-2.5 inline-block">
              Continue Browsing
            </Link>
          </div>
        </div>
      )}

      {/* Title Requests Section — shown when logged in */}
      {isLoggedIn && (
        <div className="mt-16">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
              ✦ My Requests ✦
            </p>
            <h2 className="font-display text-2xl font-bold" style={{ color: '#3A2214' }}>
              Title Requests
            </h2>
            <p className="text-sm mt-1" style={{ color: '#6B5040' }}>
              Titles you&apos;ve requested from us.
            </p>
          </div>

          {requestsLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
            </div>
          ) : titleRequests.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: 'rgba(251,245,236,0.7)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}
            >
              <p className="text-sm" style={{ color: '#6B5040' }}>
                You haven&apos;t submitted any title requests yet.
              </p>
              <Link href="/request" className="btn-primary text-sm px-6 py-2.5 inline-block mt-4">
                Request a Title
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {titleRequests.map(req => {
                const statusColor = REQUEST_STATUS_COLORS[req.status] ?? '#f59e0b';
                const hasAdminNote = req.admin_notes && req.admin_notes.trim().length > 0;
                const hasOwnerNote = req.owner_notes && req.owner_notes.trim().length > 0;
                return (
                  <div
                    key={req.id}
                    className="rounded-xl p-5"
                    style={{ background: 'rgba(251,245,236,0.7)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-display text-sm font-bold" style={{ color: '#3A2214' }}>
                            {req.requested_title}
                          </span>
                          <span
                            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                            style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}
                          >
                            {req.status}
                          </span>
                        </div>
                        {req.requested_author && (
                          <p className="text-xs italic mb-1" style={{ color: '#6B5040' }}>
                            by {req.requested_author}
                          </p>
                        )}
                        <p className="text-xs" style={{ color: '#9B8070' }}>
                          {req.ref_number} · Submitted {formatDate(req.created_at)}
                        </p>
                      </div>
                    </div>
                    {req.notes && (
                      <p className="text-xs mt-2 pt-2" style={{ color: '#6B5040', borderTop: '1px solid var(--border)' }}>
                        <span className="font-semibold">Your note:</span> {req.notes}
                      </p>
                    )}
                    {hasOwnerNote && (
                      <div className="mt-2 pt-2 rounded-lg px-3 py-2" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderTop: 'none' }}>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--primary)' }}>✦ Update from us</p>
                        <p className="text-xs" style={{ color: '#6B5040' }}>{req.owner_notes}</p>
                      </div>
                    )}
                    {hasAdminNote && !hasOwnerNote && (
                      <div className="mt-2 pt-2 rounded-lg px-3 py-2" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderTop: 'none' }}>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: '#10b981' }}>✦ Note</p>
                        <p className="text-xs" style={{ color: '#6B5040' }}>{req.admin_notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
