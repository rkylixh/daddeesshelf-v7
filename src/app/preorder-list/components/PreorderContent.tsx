'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import StatusBadge from '@/components/books/StatusBadge';
import { getPreorderBooks } from '@/lib/books';
import { Book } from '@/lib/types';
import { supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────
interface PreorderItem {
  book: Book;
  qty: number;
}

interface PreorderForm {
  tiktok_handle: string;
  full_name: string;
  contact_number: string;
  shipping_address: string;
  preferred_courier: string;
  payment_method: string;
  payment_ref: string;
  notes: string;
  is_pile_shipping: boolean;
}

interface ConfirmationData {
  order_ref: string;
  tiktok_handle: string;
  date_submitted: string;
  items: PreorderItem[];
  payment_ref: string;
  status: string;
}

// ── Order Reference Generator ──────────────────────────────
function generateOrderRef(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
  return `DDS-${date}-${seq}`;
}

// ── Success Overlay ────────────────────────────────────────
function SuccessOverlay({ data, onClose }: { data: ConfirmationData; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.order_ref).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const totalQty = data.items.reduce((s, i) => s + i.qty, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ background: 'var(--background-card)', border: '1px solid rgba(139,92,246,0.4)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(79,70,229,0.15))', borderBottom: '1px solid rgba(139,92,246,0.3)' }}
        >
          <div className="text-4xl mb-2" aria-hidden="true">✓</div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--primary-bright)' }}>
            Order Successfully Submitted
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
            {new Date(data.date_submitted).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Order details */}
        <div className="p-6 space-y-4">
          {/* Order Reference */}
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-subtle)', letterSpacing: '0.15em' }}>
              Order Reference Number
            </p>
            <p className="font-display text-2xl font-bold" style={{ color: 'var(--primary-bright)' }}>
              {data.order_ref}
            </p>
          </div>

          {/* Details grid */}
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>TikTok Handle</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{data.tiktok_handle}</span>
            </div>
            <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Payment Reference</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{data.payment_ref}</span>
            </div>
            <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Total Quantity</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{totalQty} {totalQty === 1 ? 'title' : 'titles'}</span>
            </div>
            <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Current Status</span>
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                {data.status}
              </span>
            </div>
          </div>

          {/* Titles ordered */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground-subtle)' }}>Titles Ordered</p>
            <div className="space-y-1.5">
              {data.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--foreground-muted)' }} className="truncate pr-2">{item.book.title}</span>
                  <span className="flex-shrink-0 font-semibold" style={{ color: 'var(--primary-bright)' }}>× {item.qty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TikTok reminder */}
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <p className="text-sm font-bold mb-2" style={{ color: '#f87171' }}>
              ⚠️ Important Reminder
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
              Please take a screenshot of this page and send it together with your Order Reference Number to our official TikTok account:
            </p>
            <p className="font-display text-lg font-bold mt-2 mb-2" style={{ color: 'var(--primary-bright)' }}>
              @daddees.shelf
            </p>
            <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
              Your preorder will only be processed after payment has been verified.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCopy}
              className="btn-primary flex-1 text-sm py-2.5"
            >
              {copied ? '✓ Copied!' : 'Copy Order Reference'}
            </button>
            <button
              onClick={handlePrint}
              className="btn-secondary flex-1 text-sm py-2.5"
            >
              Print / Download
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full text-xs py-2"
            style={{ color: 'var(--foreground-subtle)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preorder Form Modal ────────────────────────────────────
function PreorderFormModal({
  items,
  onClose,
  onSuccess,
}: {
  items: PreorderItem[];
  onClose: () => void;
  onSuccess: (data: ConfirmationData) => void;
}) {
  const [form, setForm] = useState<PreorderForm>({
    tiktok_handle: '',
    full_name: '',
    contact_number: '',
    shipping_address: '',
    preferred_courier: '',
    payment_method: '',
    payment_ref: '',
    notes: '',
    is_pile_shipping: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalPrice = items.reduce((s, i) => s + i.book.final_srp * i.qty, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tiktok_handle.trim()) { setError('TikTok Handle is required.'); return; }
    if (!form.payment_method) { setError('Please select a payment method.'); return; }
    if (!form.payment_ref.trim()) { setError('Payment Reference Number is required.'); return; }

    setSubmitting(true);
    setError('');

    const orderRef = generateOrderRef();
    const orderItems = items.map(i => ({
      sku: i.book.sku,
      title: i.book.title,
      qty: i.qty,
      price: i.book.final_srp,
    }));

    try {
      const { error: err } = await supabase.from('orders').insert({
        ref_number: orderRef,
        customer_name: form.full_name || form.tiktok_handle,
        tiktok_handle: form.tiktok_handle,
        items: orderItems,
        total_price: totalPrice,
        payment_method: form.payment_method,
        payment_ref: form.payment_ref,
        contact_number: form.contact_number,
        shipping_address: form.shipping_address,
        preferred_courier: form.preferred_courier,
        notes: form.notes,
        is_pile_shipping: form.is_pile_shipping,
        status: 'Pending Payment Verification',
      });
      if (err) throw err;

      onSuccess({
        order_ref: orderRef,
        tiktok_handle: form.tiktok_handle,
        date_submitted: new Date().toISOString(),
        items,
        payment_ref: form.payment_ref,
        status: 'Pending Payment Verification',
      });
    } catch {
      setError('Something went wrong. Please try again or message us on TikTok @daddees.shelf.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl animate-fade-in-up"
        style={{ background: 'var(--background-card)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--foreground)' }}>Submit Preorder</h2>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg">
            <span className="text-xl" aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Order summary */}
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(139,92,246,0.04)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground-subtle)' }}>Preorder Summary</p>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs mb-1">
              <span style={{ color: 'var(--foreground-muted)' }}>{item.book.title} × {item.qty}</span>
              <span style={{ color: 'var(--primary-bright)' }}>₱{(item.book.final_srp * item.qty).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--foreground)' }}>Total</span>
            <span style={{ color: 'var(--primary-bright)' }}>₱{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* TikTok Handle — required */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              TikTok Handle <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={form.tiktok_handle}
              onChange={e => setForm(f => ({ ...f, tiktok_handle: e.target.value }))}
              className="input-field text-sm"
              placeholder="@yourtiktok"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
              You must be a follower of @daddees.shelf to place pre-orders.
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              Full Name <span className="text-xs font-normal" style={{ color: 'var(--foreground-subtle)' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="input-field text-sm"
              placeholder="Your full name"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              Contact Number <span className="text-xs font-normal" style={{ color: 'var(--foreground-subtle)' }}>(optional)</span>
            </label>
            <input
              type="tel"
              value={form.contact_number}
              onChange={e => setForm(f => ({ ...f, contact_number: e.target.value }))}
              className="input-field text-sm"
              placeholder="09XX XXX XXXX"
            />
          </div>

          {/* Shipping Address */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              Shipping Address <span className="text-xs font-normal" style={{ color: 'var(--foreground-subtle)' }}>(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.shipping_address}
              onChange={e => setForm(f => ({ ...f, shipping_address: e.target.value }))}
              className="input-field text-sm resize-none"
              placeholder="Full delivery address"
            />
          </div>

          {/* Preferred Courier */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              Preferred Courier <span className="text-xs font-normal" style={{ color: 'var(--foreground-subtle)' }}>(optional)</span>
            </label>
            <select
              value={form.preferred_courier}
              onChange={e => setForm(f => ({ ...f, preferred_courier: e.target.value }))}
              className="select-field text-sm"
            >
              <option value="">Select courier...</option>
              <option value="Lalamove">Lalamove (Metro Manila)</option>
              <option value="Grab">Grab</option>
              <option value="J&T Express">J&T Express (Nationwide)</option>
            </select>
          </div>

          {/* Pile Shipping */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_pile_shipping}
              onChange={e => setForm(f => ({ ...f, is_pile_shipping: e.target.checked }))}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--primary)' }}
            />
            <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
              Pile / Bundle Shipping — hold my order and ship together with other titles
            </span>
          </label>

          {/* Payment Method — required */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              Payment Method <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <select
              required
              value={form.payment_method}
              onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
              className="select-field text-sm"
            >
              <option value="">Select payment method...</option>
              <option value="GCash">GCash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          {/* Payment Reference Number — required */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              Payment Reference Number / Transaction ID <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={form.payment_ref}
              onChange={e => setForm(f => ({ ...f, payment_ref: e.target.value }))}
              className="input-field text-sm"
              placeholder="e.g. GCash ref: 1234567890"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
              Enter the reference number from your GCash or bank transfer receipt.
            </p>
          </div>

          {/* Notes to Seller */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              Notes to Seller <span className="text-xs font-normal" style={{ color: 'var(--foreground-subtle)' }}>(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input-field text-sm resize-none"
              placeholder="Any special instructions or notes..."
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 text-sm"
            style={{ opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Submitting...' : 'Submit Preorder ✦'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function PreorderContent() {
  const [sortBy, setSortBy] = useState<'arrival' | 'title' | 'price'>('arrival');
  const [preorderList, setPreorderList] = useState<PreorderItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(null);
  const [allPreorderBooks, setAllPreorderBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPreorderBooks().then(books => {
      setAllPreorderBooks(books);
      setLoading(false);
    });
  }, []);

  const preorderBooks = useMemo(() => {
    const books = [...allPreorderBooks];
    if (sortBy === 'arrival') return books.sort((a, b) => (a.arrival_date ?? '').localeCompare(b.arrival_date ?? ''));
    if (sortBy === 'title') return books.sort((a, b) => a.title.localeCompare(b.title));
    return books.sort((a, b) => a.final_srp - b.final_srp);
  }, [allPreorderBooks, sortBy]);

  const byBatch = useMemo(() => {
    const map = new Map<string, Book[]>();
    preorderBooks.forEach(b => {
      const batch = b.batch || 'Upcoming';
      if (!map.has(batch)) map.set(batch, []);
      map.get(batch)!.push(b);
    });
    return map;
  }, [preorderBooks]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDaysUntil = (dateStr: string | null): number | null => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const addToList = (book: Book) => {
    setPreorderList(prev => {
      const existing = prev.find(i => i.book.id === book.id);
      if (existing) return prev.map(i => i.book.id === book.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { book, qty: 1 }];
    });
  };

  const removeFromList = (bookId: string) => {
    setPreorderList(prev => prev.filter(i => i.book.id !== bookId));
  };

  const totalListItems = preorderList.reduce((s, i) => s + i.qty, 0);

  const handleSuccess = (data: ConfirmationData) => {
    setShowForm(false);
    setPreorderList([]);
    setConfirmation(data);
  };

  return (
    <div className="content-wrapper py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Reserve Your Copy ✦
        </p>
        <h1 className="font-display text-4xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
          Preorder List
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          {preorderBooks.length} titles arriving soon. Full payment required to reserve your copy.
        </p>
      </div>

      {/* Workflow banner */}
      <div
        className="rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}
      >
        <div className="flex-shrink-0 text-2xl" aria-hidden="true">✦</div>
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
            How to Preorder
          </p>
          <p className="text-xs" style={{ color: 'var(--foreground-muted)', lineHeight: '1.6' }}>
            Browse → Click <strong>Add to Preorder List</strong> → Review your list → Click <strong>Submit Preorder</strong> → Fill in your details and payment reference → Done!
            You must be a TikTok follower of <strong style={{ color: 'var(--primary-bright)' }}>@daddees.shelf</strong> to place pre-orders.
          </p>
        </div>
      </div>

      {/* Preorder List Summary */}
      {preorderList.length > 0 && (
        <div
          className="rounded-xl p-4 mb-8"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.35)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--primary-bright)' }}>
              Your Preorder List ({totalListItems} {totalListItems === 1 ? 'item' : 'items'})
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary text-sm px-5 py-2"
            >
              Submit Preorder ✦
            </button>
          </div>
          <div className="space-y-1.5">
            {preorderList.map(item => (
              <div key={item.book.id} className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--foreground-muted)' }}>{item.book.title} × {item.qty}</span>
                <div className="flex items-center gap-3">
                  <span style={{ color: 'var(--primary-bright)' }}>₱{(item.book.final_srp * item.qty).toLocaleString()}</span>
                  <button
                    onClick={() => removeFromList(item.book.id)}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-bold mt-3 pt-3" style={{ borderTop: '1px solid rgba(139,92,246,0.3)' }}>
            <span style={{ color: 'var(--foreground)' }}>Total</span>
            <span style={{ color: 'var(--primary-bright)' }}>₱{preorderList.reduce((s, i) => s + i.book.final_srp * i.qty, 0).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Sort controls */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          {preorderBooks.length} titles on pre-order
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="select-field text-sm py-1.5 px-3"
          >
            <option value="arrival">Arrival Date</option>
            <option value="title">Title A–Z</option>
            <option value="price">Price</option>
          </select>
        </div>
      </div>

      {/* Batch groups */}
      {loading ? (
        <div
          className="flex items-center justify-center py-24"
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--primary)' }}
          />
        </div>
      ) : preorderBooks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-xl"
          style={{ border: '1px dashed var(--border)', background: 'var(--background-card)' }}
        >
          <span className="text-4xl mb-4">✦</span>
          <h3 className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>
            No pre-orders right now
          </h3>
          <p className="text-sm" style={{ color: 'var(--foreground-subtle)' }}>
            Check back soon — new batches are announced regularly.
          </p>
          <Link href="/shop" className="btn-primary mt-4 text-sm px-6">
            Browse Available Books
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {Array.from(byBatch.entries()).map(([batch, books]) => (
            <div key={`batch-${batch}`}>
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="px-4 py-2 rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--primary)', letterSpacing: '0.12em' }}>
                    {batch}
                  </p>
                </div>
                {books[0].arrival_date && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Estimated arrival:</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>
                      {formatDate(books[0].arrival_date)}
                    </span>
                    {getDaysUntil(books[0].arrival_date) !== null && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--primary-bright)', border: '1px solid rgba(139,92,246,0.3)' }}
                      >
                        {getDaysUntil(books[0].arrival_date)} days away
                      </span>
                    )}
                  </div>
                )}
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                  {books.length} {books.length === 1 ? 'title' : 'titles'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {books.map(book => {
                  const inList = preorderList.some(i => i.book.id === book.id);
                  return (
                    <div
                      key={`preorder-${book.id}`}
                      className="card-glow rounded-xl overflow-hidden flex gap-4 p-3"
                      style={{ background: 'var(--background-card)' }}
                    >
                      <div className="relative w-16 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <AppImage
                          src={book.cover_url || '/assets/images/no_image.png'}
                          alt={`Cover of ${book.title} by ${book.author}`}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <StatusBadge status="Pre-order" size="sm" />
                          <span className="text-xs tabular-nums font-bold flex-shrink-0" style={{ color: 'var(--primary-bright)' }}>
                            ₱{book.final_srp.toLocaleString()}
                          </span>
                        </div>
                        <h3
                          className="font-display text-sm font-semibold leading-snug line-clamp-2 mb-0.5"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {book.title}
                        </h3>
                        <p className="text-xs truncate mb-1" style={{ color: 'var(--foreground-muted)' }}>
                          {book.author}
                        </p>
                        <p className="text-xs mb-2" style={{ color: 'var(--foreground-subtle)' }}>
                          {book.format} · {book.genre}
                        </p>
                        <button
                          onClick={() => addToList(book)}
                          className={`mt-auto text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${inList ? 'btn-secondary' : 'btn-primary'}`}
                        >
                          {inList ? '✓ Added' : '+ Add to List'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      {preorderList.length > 0 && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-base px-10 py-3.5"
          >
            Submit Preorder ({totalListItems} {totalListItems === 1 ? 'item' : 'items'}) ✦
          </button>
        </div>
      )}

      {/* Preorder Form Modal */}
      {showForm && (
        <PreorderFormModal
          items={preorderList}
          onClose={() => setShowForm(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Success Overlay */}
      {confirmation && (
        <SuccessOverlay
          data={confirmation}
          onClose={() => setConfirmation(null)}
        />
      )}
    </div>
  );
}