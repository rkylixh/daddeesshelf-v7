'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

function genRef() {
  return 'REQ-' + Date.now().toString(36).toUpperCase();
}

export default function RequestContent() {
  const [form, setForm] = useState({ name: '', tiktok: '', title: '', author: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const ref = genRef();
      const { error: err } = await supabase.from('title_requests').insert({
        ref_number: ref,
        customer_name: form.name,
        tiktok_handle: form.tiktok,
        requested_title: form.title,
        requested_author: form.author,
        notes: form.notes,
      });
      if (err) throw err;

      // Send email notification (fire-and-forget)
      try {
        await supabase.functions.invoke('notify-email', {
          body: {
            type: 'new_title_request',
            data: {
              ref_number: ref,
              customer_name: form.name,
              tiktok_handle: form.tiktok,
              requested_title: form.title,
              requested_author: form.author,
              notes: form.notes,
            },
          },
        });
      } catch { /* non-blocking */ }

      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or message us on TikTok.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-wrapper py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Can&apos;t Find It? ✦
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Request a Title
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          Don&apos;t see the book you&apos;re looking for? Submit a request and we&apos;ll try to include it in our next import batch.
          Requests are monitored daily.
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        {submitted ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            <span className="text-5xl mb-6 block" aria-hidden="true">✦</span>
            <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--primary-bright)' }}>
              Request Submitted!
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
              Thank you! Your title request has been received. We review all requests daily and will try to include
              your book in an upcoming import batch. Follow us on TikTok for batch announcements.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', tiktok: '', title: '', author: '', notes: '' }); }}
                className="btn-secondary text-sm px-6 py-2.5"
              >
                Submit Another Request
              </button>
              <a href="/shop" className="btn-primary text-sm px-6 py-2.5 inline-block">
                Browse Available Books
              </a>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-8"
            style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="Title of the book you want"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Author
                </label>
                <input
                  type="text"
                  value={form.author}
                  onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                  className="input-field"
                  placeholder="Author name (if known)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="input-field resize-none"
                  placeholder="Edition preference, series info, or anything else we should know..."
                />
              </div>

              {error && (
                <p className="text-sm text-center" style={{ color: '#f87171' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Submitting...' : 'Submit Request ✦'}
              </button>
            </form>
          </div>
        )}

        {/* Info note */}
        <div
          className="mt-6 rounded-xl p-4 flex gap-3"
          style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          <span className="text-lg flex-shrink-0" aria-hidden="true">✦</span>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
            Requests are reviewed daily. While we cannot guarantee every title will be imported, popular requests
            heavily influence our upcoming batch selections. You must be a TikTok follower of{' '}
            <strong style={{ color: 'var(--primary-bright)' }}>@daddees.shelf</strong> to place pre-orders.
          </p>
        </div>
      </div>
    </div>
  );
}
