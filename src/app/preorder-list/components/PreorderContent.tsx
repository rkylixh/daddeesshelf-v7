'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import StatusBadge from '@/components/books/StatusBadge';
import { getPreorderBooks } from '@/lib/books';
import { Book } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/components/layout/Navbar';


// ── Types ──────────────────────────────────────────────────
interface PreorderItem {
  book: Book;
  qty: number;
}

interface PreorderForm {
  tiktok_handle: string;
  customer_pin: string;
  payment_method: string;
  payment_ref: string;
  notes: string;
}

interface ConfirmationData {
  order_ref: string;
  tiktok_handle: string;
  date_submitted: string;
  items: PreorderItem[];
  payment_ref: string;
  status: string;
  store_credit_applied?: number;
}

// ── Helpers ────────────────────────────────────────────────
function generateOrderRef(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
  return `DDS-${date}-${seq}`;
}

// Simple PIN hash using Web Crypto API
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'daddees-shelf-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── GCash QR Section ───────────────────────────────────────
function GCashQRSection() {
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }}
    >
      <p className="text-xs font-bold mb-2" style={{ color: '#10b981' }}>
        ✦ GCash Payment Instructions
      </p>
      <div className="w-48 h-48 mx-auto rounded-xl mb-3 overflow-hidden" style={{ border: '2px solid rgba(16,185,129,0.4)' }}>
        <AppImage
          src="/assets/images/36c6a594-8ce5-4d14-8600-0e7b65f58ff0-1786006380177.jpg"
          alt="GCash QR code for Daddee's Shelf payment"
          width={192}
          height={192}
          className="w-full h-full object-cover"
        />
      </div>
      <ol className="text-xs text-left space-y-1.5 max-w-xs mx-auto" style={{ color: 'var(--foreground-muted)' }}>
        <li className="flex gap-2"><span className="font-bold" style={{ color: '#10b981' }}>1.</span> Scan the QR code above with your GCash app</li>
        <li className="flex gap-2"><span className="font-bold" style={{ color: '#10b981' }}>2.</span> Send the exact total amount</li>
        <li className="flex gap-2"><span className="font-bold" style={{ color: '#10b981' }}>3.</span> Copy your GCash Reference Number</li>
        <li className="flex gap-2"><span className="font-bold" style={{ color: '#10b981' }}>4.</span> Paste it in the field below</li>
      </ol>
    </div>
  );
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

  const totalQty = data.items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = data.items.reduce((s, i) => s + i.book.final_srp * i.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in-up" style={{ background: 'var(--background-card)', border: '1px solid rgba(184,134,11,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="px-6 py-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(184,134,11,0.15), rgba(139,69,19,0.1))', borderBottom: '1px solid rgba(184,134,11,0.3)' }}>
          <div className="text-4xl mb-2" aria-hidden="true">✓</div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--primary-bright)' }}>Preorder Successfully Submitted</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
            {new Date(data.date_submitted).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(184,134,11,0.08)', border: '1px solid rgba(184,134,11,0.25)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-subtle)', letterSpacing: '0.15em' }}>Order Reference Number</p>
            <p className="font-display text-2xl font-bold" style={{ color: 'var(--primary-bright)' }}>{data.order_ref}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>TikTok Handle</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{data.tiktok_handle}</span>
            </div>
            <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>GCash Reference</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{data.payment_ref}</span>
            </div>
            <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Total ({totalQty} {totalQty === 1 ? 'title' : 'titles'})</span>
              <span className="text-sm font-bold" style={{ color: 'var(--primary-bright)' }}>₱{totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Status</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                {data.status}
              </span>
            </div>
          </div>

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

          <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <p className="text-xs font-bold mb-1" style={{ color: '#10b981' }}>✦ What Happens Next?</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
              Your payment reference will be verified by our team. Shipping details will be collected once your books arrive. Use your 4-digit PIN to track your order at <strong>My Orders</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleCopy} className="btn-primary flex-1 text-sm py-2.5">
              {copied ? '✓ Copied!' : 'Copy Order Reference'}
            </button>
            <Link href="/orders" className="btn-secondary flex-1 text-sm py-2.5 text-center">
              Track My Order
            </Link>
          </div>

          <button onClick={onClose} className="w-full text-xs py-2" style={{ color: 'var(--foreground-subtle)' }}>Close</button>
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
    customer_pin: '',
    payment_method: 'GCash',
    payment_ref: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [storeCredit, setStoreCredit] = useState<{ id: string; amount: number } | null>(null);
  const [checkingCredit, setCheckingCredit] = useState(false);

  const baseTotal = items.reduce((s, i) => s + i.book.final_srp * i.qty, 0);
  const creditApplied = storeCredit ? Math.min(storeCredit.amount, baseTotal) : 0;
  const totalPrice = Math.max(0, baseTotal - creditApplied);

  // Check for active store credit when handle changes (debounced)
  useEffect(() => {
    const handle = form.tiktok_handle.trim().replace(/^@/, '');
    if (!handle) { setStoreCredit(null); return; }
    const timer = setTimeout(async () => {
      setCheckingCredit(true);
      try {
        const { data } = await supabase
          .from('store_credits')
          .select('id, amount')
          .eq('tiktok_handle', handle)
          .eq('status', 'Active')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        setStoreCredit(data ? { id: data.id, amount: data.amount } : null);
      } catch {
        setStoreCredit(null);
      } finally {
        setCheckingCredit(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [form.tiktok_handle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tiktok_handle.trim()) { setError('TikTok Handle is required.'); return; }
    if (form.customer_pin.length !== 4 || !/^\d{4}$/.test(form.customer_pin)) {
      setError('PIN must be exactly 4 digits.'); return;
    }
    if (!form.payment_ref.trim() && totalPrice > 0) { setError('GCash Reference Number is required.'); return; }

    setSubmitting(true);
    setError('');

    try {
      const orderRef = generateOrderRef();
      const hashedPin = await hashPin(form.customer_pin);
      const orderItems = items.map(i => ({
        sku: i.book.sku,
        title: i.book.title,
        qty: i.qty,
        price: i.book.final_srp,
        batch: i.book.batch,
      }));

      const { error: err } = await supabase.from('orders').insert({
        ref_number: orderRef,
        customer_name: form.tiktok_handle,
        tiktok_handle: form.tiktok_handle,
        customer_pin: hashedPin,
        items: orderItems,
        total_price: totalPrice,
        payment_method: 'GCash',
        payment_ref: form.payment_ref,
        notes: form.notes,
        status: 'Pending Payment Verification',
        store_credit_applied: creditApplied,
        store_credit_id: storeCredit?.id ?? null,
      });
      if (err) throw err;

      // Mark store credit as used
      if (storeCredit && creditApplied > 0) {
        await supabase.from('store_credits').update({
          status: 'Used',
          used_on_order_ref: orderRef,
          updated_at: new Date().toISOString(),
        }).eq('id', storeCredit.id);
      }

      onSuccess({
        order_ref: orderRef,
        tiktok_handle: form.tiktok_handle,
        date_submitted: new Date().toISOString(),
        items,
        payment_ref: form.payment_ref,
        status: 'Pending Payment Verification',
        store_credit_applied: creditApplied,
      });
    } catch {
      setError('Something went wrong. Please try again or message us on TikTok @daddees.shelf.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="relative w-full max-w-lg rounded-2xl animate-fade-in-up" style={{ background: 'var(--background-card)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--foreground)' }}>Submit Preorder</h2>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg">
            <span className="text-xl" aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Order summary — only shows items in the cart */}
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(184,134,11,0.04)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground-subtle)' }}>Your Cart ({items.length} {items.length === 1 ? 'title' : 'titles'})</p>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs mb-1">
              <span style={{ color: 'var(--foreground-muted)' }}>{item.book.title} × {item.qty}</span>
              <span style={{ color: 'var(--primary-bright)' }}>₱{(item.book.final_srp * item.qty).toLocaleString()}</span>
            </div>
          ))}
          {creditApplied > 0 && (
            <div className="flex justify-between text-xs mt-1.5 pt-1.5" style={{ borderTop: '1px solid rgba(16,185,129,0.2)' }}>
              <span style={{ color: '#10b981' }}>✦ Store Credit Applied</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>−₱{creditApplied.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--foreground)' }}>Total{creditApplied > 0 ? ' (after credit)' : ''}</span>
            <span style={{ color: 'var(--primary-bright)' }}>₱{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* TikTok Handle */}
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
              You must be a follower of @daddees.shelf to place preorders.
            </p>
            {/* Store credit notice */}
            {checkingCredit && (
              <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>Checking for store credits...</p>
            )}
            {!checkingCredit && storeCredit && (
              <div
                className="mt-2 rounded-lg px-3 py-2 text-xs font-semibold"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
              >
                ✦ You have ₱{storeCredit.amount.toLocaleString()} store credit — automatically applied to this order!
              </div>
            )}
          </div>

          {/* 4-digit PIN */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              4-Digit PIN <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <input
              type="password"
              required
              maxLength={4}
              value={form.customer_pin}
              onChange={e => setForm(f => ({ ...f, customer_pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              className="input-field text-sm text-center tracking-widest"
              placeholder="••••"
              inputMode="numeric"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
              Remember this PIN — you will use it to track your preorder in My Orders.
            </p>
          </div>

          {/* GCash QR */}
          <GCashQRSection />

          {/* Payment Reference */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              GCash Reference Number <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={form.payment_ref}
              onChange={e => setForm(f => ({ ...f, payment_ref: e.target.value }))}
              className="input-field text-sm"
              placeholder="e.g. 1234567890"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
              Copy the reference number from your GCash transaction receipt.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              Notes <span className="text-xs font-normal" style={{ color: 'var(--foreground-subtle)' }}>(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input-field text-sm resize-none"
              placeholder="Any special instructions..."
            />
          </div>

          <div className="rounded-xl p-3" style={{ background: 'rgba(184,134,11,0.06)', border: '1px solid rgba(184,134,11,0.2)' }}>
            <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
              <strong style={{ color: 'var(--primary-bright)' }}>Note:</strong> Shipping details will be collected after your books arrive. Supported couriers: J&T Express (Nationwide) and Lalamove (Metro Manila / Nearby Areas).
            </p>
          </div>

          {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}

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
  const { items: cartItems, addItem: addToCart, clearCart } = useCart();

  useEffect(() => {
    getPreorderBooks().then(books => {
      setAllPreorderBooks(books);
      setLoading(false);
    });
  }, []);

  // Sync cart items to local preorder list
  useEffect(() => {
    if (cartItems.length > 0) {
      setPreorderList(cartItems);
    }
  }, [cartItems]);

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
    addToCart(book);
  };

  const removeFromList = (bookId: string) => {
    setPreorderList(prev => prev.filter(i => i.book.id !== bookId));
  };

  const updateQty = (bookId: string, qty: number) => {
    if (qty <= 0) { removeFromList(bookId); return; }
    setPreorderList(prev => prev.map(i => i.book.id === bookId ? { ...i, qty } : i));
  };

  const isInList = (bookId: string) => preorderList.some(i => i.book.id === bookId);
  const totalPrice = preorderList.reduce((s, i) => s + i.book.final_srp * i.qty, 0);

  const handleSuccess = (data: ConfirmationData) => {
    setShowForm(false);
    setConfirmation(data);
    setPreorderList([]);
    clearCart();
  };

  // Determine active batch (FIFO: earliest future arrival_date)
  const activeBatch = useMemo(() => {
    const batches = Array.from(byBatch.keys());
    if (batches.length === 0) return null;
    // Find batch with earliest future arrival date
    let earliest: string | null = null;
    let earliestDate: Date | null = null;
    const now = new Date();
    for (const [batchName, books] of byBatch.entries()) {
      const dates = books.map(b => b.arrival_date).filter(Boolean) as string[];
      if (dates.length === 0) continue;
      const minDate = new Date(Math.min(...dates.map(d => new Date(d).getTime())));
      if (minDate > now && (earliestDate === null || minDate < earliestDate)) {
        earliest = batchName;
        earliestDate = minDate;
      }
    }
    return earliest ?? batches[0];
  }, [byBatch]);

  return (
    <div className="content-wrapper py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Open for Preorder ✦
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Preorder List
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          Reserve your copies from the current import batch. Add titles to your cart and checkout when ready.
        </p>
      </div>

      {/* Sort + Cart Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>Sort by:</span>
          {(['arrival', 'title', 'price'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${sortBy === s ? 'btn-primary' : 'btn-secondary'}`}
            >
              {s === 'arrival' ? 'Arrival Date' : s === 'title' ? 'Title' : 'Price'}
            </button>
          ))}
        </div>

        {preorderList.length > 0 && (
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-2.5"
            style={{ background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.3)' }}
          >
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--primary-bright)' }}>
                {preorderList.reduce((s, i) => s + i.qty, 0)} title{preorderList.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Total: ₱{totalPrice.toLocaleString()}</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary text-xs px-4 py-2"
            >
              Preorder Now ✦
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : preorderBooks.length === 0 ? (
        <div className="text-center py-24">
          <span className="text-5xl mb-4 block" aria-hidden="true">✦</span>
          <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>No Preorders Open</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>Check back soon for the next import batch.</p>
          <Link href="/shop" className="btn-primary text-sm px-8 py-3 inline-block">Browse All Books ✦</Link>
        </div>
      ) : (
        <div className="space-y-12">
          {Array.from(byBatch.entries()).map(([batchName, books]) => {
            const isActive = batchName === activeBatch;
            const batchEta = books[0]?.arrival_date ?? null;
            const daysUntil = getDaysUntil(batchEta);

            return (
              <div key={batchName}>
                {/* Batch Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-display text-xl font-bold" style={{ color: 'var(--foreground)' }}>{batchName}</h2>
                      {isActive && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(184,134,11,0.2)', color: 'var(--primary-bright)', border: '1px solid rgba(184,134,11,0.4)' }}>
                          ✦ Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                      {books.some(b => b.is_eta_visible !== false) ? (
                        <>
                          ETA: <strong style={{ color: 'var(--foreground)' }}>{formatDate(batchEta)}</strong>
                          {daysUntil !== null && daysUntil > 0 && (
                            <span className="ml-2 text-xs" style={{ color: 'var(--foreground-subtle)' }}>({daysUntil} days away)</span>
                          )}
                        </>
                      ) : (
                        <span>ETA: <strong style={{ color: 'var(--foreground)' }}>TBA</strong></span>
                      )}
                    </p>
                  </div>
                  {isActive && (
                    <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>{books.length} titles available</span>
                  )}
                </div>

                {/* FIFO: Only show covers/prices/preorder for active batch */}
                {isActive ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {books.map(book => {
                      const inList = isInList(book.id);
                      const listItem = preorderList.find(i => i.book.id === book.id);
                      const available = book.inventory - book.reserved;

                      return (
                        <div key={book.id} className="flex flex-col">
                          <Link href={`/book-detail?id=${book.id}`} className="block group mb-2">
                            <div className="card-glow rounded-xl overflow-hidden" style={{ background: 'var(--background-card)' }}>
                              <div className="relative aspect-[2/3] overflow-hidden">
                                <AppImage
                                  src={book.cover_url || '/assets/images/no_image.png'}
                                  alt={`Cover of ${book.title} by ${book.author}`}
                                  fill
                                  sizes="(max-width: 640px) 50vw, 20vw"
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute bottom-2 left-2">
                                  <StatusBadge status={book.status!} size="sm" />
                                </div>
                              </div>
                              <div className="p-2.5">
                                <p className="text-xs font-medium mb-0.5 truncate" style={{ color: 'var(--foreground-subtle)' }}>{book.genre}</p>
                                <h3 className="font-display text-xs font-semibold leading-snug mb-0.5 line-clamp-2" style={{ color: 'var(--foreground)' }}>{book.title}</h3>
                                <p className="text-xs mb-1.5 truncate" style={{ color: 'var(--foreground-muted)' }}>{book.author}</p>
                                {book.is_price_visible !== false ? (
                                  <p className="text-sm font-bold" style={{ color: 'var(--primary-bright)' }}>₱{book.final_srp.toLocaleString()}</p>
                                ) : (
                                  <p className="text-xs font-medium" style={{ color: 'var(--foreground-subtle)' }}>Price TBA</p>
                                )}
                              </div>
                            </div>
                          </Link>

                          {available > 0 ? (
                            inList ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => updateQty(book.id, (listItem?.qty ?? 1) - 1)} className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-sm font-bold" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>−</button>
                                <span className="flex-1 text-center text-xs font-bold" style={{ color: 'var(--foreground)' }}>{listItem?.qty}</span>
                                <button onClick={() => updateQty(book.id, (listItem?.qty ?? 1) + 1)} className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-sm font-bold" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>+</button>
                                <button onClick={() => removeFromList(book.id)} className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>✕</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToList(book)}
                                className="btn-primary text-xs py-2 w-full"
                              >
                                + Preorder
                              </button>
                            )
                          ) : (
                            <button disabled className="text-xs py-2 w-full rounded-lg font-semibold" style={{ background: 'var(--muted)', color: 'var(--foreground-subtle)', cursor: 'not-allowed' }}>
                              Sold Out
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Future batch: name + ETA only, no covers/prices/preorder
                  <div
                    className="rounded-xl p-6 text-center"
                    style={{ background: 'rgba(184,134,11,0.04)', border: '1px dashed rgba(184,134,11,0.2)' }}
                  >
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                      This batch will open for preorder once the current batch has substantially sold.
                    </p>
                    <p className="text-xs mt-2" style={{ color: 'var(--foreground-subtle)' }}>
                      Estimated Arrival: <strong style={{ color: 'var(--foreground)' }}>{formatDate(batchEta)}</strong>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Preorder Form Modal */}
      {showForm && preorderList.length > 0 && (
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