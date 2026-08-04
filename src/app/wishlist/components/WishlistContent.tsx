'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabase';

function genRef() {
  return 'WL-' + Date.now().toString(36).toUpperCase();
}

export default function WishlistContent() {
  const [form, setForm] = useState({ name: '', tiktok: '', sku: '', title: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.from('wishlists').insert({
        ref_number: genRef(),
        customer_name: form.name,
        tiktok_handle: form.tiktok,
        book_sku: form.sku,
        book_title: form.title,
      });
      if (err) throw err;
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-wrapper py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Save for Later ✦
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Wishlist
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          Found a sold-out title you love? Add it to your wishlist and we&apos;ll notify you when it&apos;s back in stock
          or included in an upcoming batch.
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        {submitted ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            <span className="text-5xl mb-6 block" aria-hidden="true">♡</span>
            <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--primary-bright)' }}>
              Added to Wishlist!
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
              We&apos;ve noted your interest. You&apos;ll be among the first to know when this title becomes available.
              Follow us on TikTok for real-time updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', tiktok: '', sku: '', title: '' }); }}
                className="btn-secondary text-sm px-6 py-2.5"
              >
                Add Another Title
              </button>
              <Link href="/shop" className="btn-primary text-sm px-6 py-2.5 inline-block">
                Browse Available Books
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-8"
            style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Icon name="HeartIcon" size={20} style={{ color: 'var(--primary-bright)' } as React.CSSProperties} />
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                Join the Waitlist
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    Your Name <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="input-field"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                    TikTok Handle <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.tiktok}
                    onChange={e => setForm(f => ({ ...f, tiktok: e.target.value }))}
                    className="input-field"
                    placeholder="@yourtiktok"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Book Title <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="input-field"
                  placeholder="Title of the book"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  SKU (if known)
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. RMT-010"
                />
              </div>
              {error && (
                <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Saving...' : '♡ Add to Wishlist'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
