'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabase';

// ── Social platform config ─────────────────────────────────
// To re-enable a platform, set enabled: true via Admin Dashboard in the future.
const SOCIAL_PLATFORMS = [
  {
    id: 'tiktok',
    icon: 'ChatBubbleLeftRightIcon' as const,
    label: 'TikTok',
    value: '@daddees.shelf',
    href: 'https://tiktok.com/@daddees.shelf',
    desc: 'Best for preorder inquiries, updates, live selling, announcements, and customer support.',
    enabled: true,
  },
  {
    id: 'facebook',
    icon: 'EnvelopeIcon' as const,
    label: 'Facebook',
    value: "Daddee\'s Shelf",
    href: 'https://facebook.com',
    desc: 'Message us for pre-order support.',
    enabled: false, // Hidden — can be re-enabled via Admin Dashboard
  },
  {
    id: 'instagram',
    icon: 'CameraIcon' as const,
    label: 'Instagram',
    value: '@daddeesshelf',
    href: 'https://instagram.com',
    desc: 'Follow for book updates and announcements.',
    enabled: false, // Hidden — can be re-enabled via Admin Dashboard
  },
];

export default function ContactContent() {
  const [form, setForm] = useState({ display_name: '', tiktok: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.display_name.trim() || !form.tiktok.trim() || !form.message.trim() || !form.subject) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { error: err } = await supabase.from('support_tickets').insert({
        name: form.display_name.trim(),
        tiktok_handle: form.tiktok.trim().replace(/^@/, ''),
        subject: form.subject,
        message: form.message.trim(),
        status: 'New',
      });
      if (err) throw err;
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or message us on TikTok.');
    } finally {
      setSubmitting(false);
    }
  };

  const visiblePlatforms = SOCIAL_PLATFORMS.filter(p => p.enabled);

  return (
    <div className="content-wrapper py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Get in Touch ✦
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Contact Us
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          Have a question about your order, a book request, or just want to say hi? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
        {/* Contact channels */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
            Reach Us Directly
          </h2>

          {/* Visible social platforms only */}
          {visiblePlatforms.map(c => (
            <a
              key={c.id}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-4 rounded-xl transition-all group"
              style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--primary-bright)' }}
              >
                <Icon name={c.icon} size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--foreground-subtle)' }}>{c.label}</p>
                <p className="font-semibold text-sm" style={{ color: 'var(--primary-bright)' }}>{c.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>{c.desc}</p>
              </div>
            </a>
          ))}

          {/* Location */}
          <div
            className="p-4 rounded-xl"
            style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--primary-bright)' }}
              >
                <Icon name="MapPinIcon" size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--foreground-subtle)' }}>Location</p>
                <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Tondo, Manila, Philippines</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                  Location provided for general reference only. Pickup instructions (if applicable) will be communicated separately after your preorder is ready.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form — saves as support ticket */}
        <div>
          <h2 className="font-display text-xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
            Send a Message
          </h2>
          {submitted ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              <span className="text-4xl mb-4 block" aria-hidden="true">✦</span>
              <h3 className="font-display text-lg font-bold mb-2" style={{ color: '#10b981' }}>Message Sent!</h3>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                Thank you for reaching out. We&apos;ll get back to you as soon as possible via TikTok or the contact method you provided.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Display Name <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.display_name}
                  onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                  className="input-field"
                  placeholder="Your display name"
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
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Subject <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <select
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="select-field w-full"
                  required
                >
                  <option value="">Select a subject</option>
                  <option>Order Inquiry</option>
                  <option>Pre-order Question</option>
                  <option>Shipping Question</option>
                  <option>Book Request</option>
                  <option>Payment Issue</option>
                  <option>General Question</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Message <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="input-field resize-none"
                  placeholder="Tell us how we can help..."
                />
              </div>
              {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3 text-sm"
                style={{ opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Sending...' : 'Send Message ✦'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
