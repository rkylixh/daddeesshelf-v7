'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

// ── Types ──────────────────────────────────────────────────
interface OrderItem {
  title: string;
  sku: string;
  qty: number;
  price: number;
  batch?: string;
}

interface Order {
  id: string;
  ref_number: string;
  created_at: string;
  items: OrderItem[];
  total_price: number;
  payment_method: string;
  payment_ref: string;
  status: string;
  tracking_status: string;
  waybill_number: string;
  is_pile_shipping: boolean;
  shipment_batch?: string;
  notes?: string;
  customer_pin?: string;
}

type AuthStep = 'handle' | 'enter-pin' | 'create-pin' | 'orders';

// ── Status config ──────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  'Pending Payment Verification': '#f59e0b',
  'Payment Verified': '#10b981',
  'Supplier Ordered': '#3b82f6',
  'In Transit': '#8b5cf6',
  'Arrived': '#06b6d4',
  'Packed': '#6366f1',
  'Shipped': '#a855f7',
  'Completed': '#10b981',
  'Cancelled': '#6b7280',
  'Abandoned': '#6b7280',
  'Pending': '#f59e0b',
  'Fully Paid': '#10b981',
  'Refunded': '#ef4444',
};

const ORDER_STATUS_STEPS = [
  'Pending Payment Verification',
  'Payment Verified',
  'Supplier Ordered',
  'In Transit',
  'Arrived',
  'Packed',
  'Shipped',
  'Completed',
];

// ── PIN hash (must match preorder form) ───────────────────
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'daddees-shelf-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Timeline Component ─────────────────────────────────────
function PreorderTimeline({ status }: { status: string }) {
  const currentIdx = ORDER_STATUS_STEPS.indexOf(status);
  if (currentIdx === -1) return null;

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold mb-3" style={{ color: 'var(--foreground-subtle)' }}>Order Timeline</p>
      <div className="flex flex-wrap gap-1">
        {ORDER_STATUS_STEPS.map((step, i) => {
          const isDone = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={step} className="flex items-center gap-1">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: isDone ? (isCurrent ? 'rgba(139,92,246,0.25)' : 'rgba(16,185,129,0.15)') : 'var(--muted)',
                  color: isDone ? (isCurrent ? 'var(--primary-bright)' : '#10b981') : 'var(--foreground-subtle)',
                  border: `1px solid ${isDone ? (isCurrent ? 'rgba(139,92,246,0.4)' : 'rgba(16,185,129,0.3)') : 'var(--border)'}`,
                }}
              >
                {isDone && !isCurrent && <span>✓</span>}
                {isCurrent && <span>●</span>}
                <span>{step}</span>
              </div>
              {i < ORDER_STATUS_STEPS.length - 1 && (
                <span className="text-xs" style={{ color: 'var(--border)' }}>›</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Order Card ─────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = STATUS_COLORS[order.status] ?? '#f59e0b';
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
    >
      {/* Summary row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-display text-sm font-bold" style={{ color: 'var(--primary-bright)' }}>{order.ref_number}</span>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}
            >
              {order.status}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
            {formatDate(order.created_at)} · {order.items?.length ?? 0} title{(order.items?.length ?? 0) !== 1 ? 's' : ''} · ₱{Number(order.total_price).toLocaleString()}
          </p>
          {order.waybill_number && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--primary-bright)', border: '1px solid rgba(139,92,246,0.3)' }}>
                🚚 Tracking: {order.waybill_number}
              </span>
            </div>
          )}
        </div>
        <Icon name={expanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} style={{ color: 'var(--foreground-subtle)', flexShrink: 0 } as React.CSSProperties} />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="pt-4 space-y-3">
            {/* Items */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground-subtle)' }}>Books Ordered</p>
              <div className="space-y-1.5">
                {(order.items ?? []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex-1 min-w-0">
                      <span style={{ color: 'var(--foreground-muted)' }} className="truncate block">{item.title}</span>
                      {item.batch && <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>{item.batch}</span>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <span style={{ color: 'var(--foreground-subtle)' }}>× {item.qty}</span>
                      <span className="font-semibold" style={{ color: 'var(--primary-bright)' }}>₱{(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <div>
                <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Payment Method</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{order.payment_method || 'GCash'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Payment Reference</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{order.payment_ref || '—'}</p>
              </div>
              {order.waybill_number && (
                <div>
                  <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Waybill</p>
                  <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{order.waybill_number}</p>
                </div>
              )}
              {order.shipment_batch && (
                <div>
                  <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Shipment Batch</p>
                  <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{order.shipment_batch}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <PreorderTimeline status={order.status} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function MyOrdersContent() {
  const { customer, isLoggedIn } = useCustomerAuth();
  const [step, setStep] = useState<AuthStep>('handle');
  const [handle, setHandle] = useState('');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');

  const handleInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const newPinInputRef = useRef<HTMLInputElement>(null);

  // Auto-load orders when customer is logged in via CustomerAuthContext
  useEffect(() => {
    if (!isLoggedIn || !customer) return;
    const autoLoad = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const rawHandle = customer.tiktokHandle.replace(/^@/, '');
        const normalizedHandle = '@' + rawHandle;
        // Search both '@handle' and 'handle' variants to catch orders stored under either format
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .in('tiktok_handle', [normalizedHandle, rawHandle])
          .order('created_at', { ascending: false });
        setOrders((orderData ?? []) as Order[]);
        setHandle(normalizedHandle);
        setStep('orders');
      } catch {
        // ignore — fall through to manual login
      } finally {
        setLoading(false);
      }
    };
    autoLoad();
  }, [isLoggedIn, customer]);

  useEffect(() => {
    if (step === 'handle') handleInputRef.current?.focus();
    else if (step === 'enter-pin') pinInputRef.current?.focus();
    else if (step === 'create-pin') newPinInputRef.current?.focus();
  }, [step]);

  // Step 1: Check if TikTok handle exists and has a PIN
  const handleCheckHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) { setError('TikTok Handle is required.'); return; }
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const rawHandle = handle.trim().replace(/^@/, '');
      const normalizedHandle = '@' + rawHandle;

      // Check customers table first
      const { data: customer } = await supabase
        .from('customers')
        .select('id, tiktok_handle, pin_hash, pin_enrolled')
        .eq('tiktok_handle', normalizedHandle)
        .maybeSingle();

      if (customer) {
        setCustomerId(customer.id);
        if (!customer.pin_enrolled || !customer.pin_hash) {
          // Customer exists but no PIN yet — create PIN
          setStep('create-pin');
        } else {
          // Customer has PIN — enter PIN
          setStep('enter-pin');
        }
        return;
      }

      // No customer record — check if they have any orders (legacy customers without customer record)
      const { data: existingOrders } = await supabase
        .from('orders')
        .select('id, customer_pin')
        .eq('tiktok_handle', normalizedHandle)
        .limit(1);

      if (existingOrders && existingOrders.length > 0) {
        // Legacy customer with orders but no customer record — create customer record and prompt PIN creation
        const { data: newCustomer, error: insertErr } = await supabase
          .from('customers')
          .insert({ tiktok_handle: normalizedHandle, pin_hash: '', pin_enrolled: false })
          .select('id')
          .single();

        if (insertErr || !newCustomer) {
          // If insert fails (e.g. already exists race condition), try select again
          const { data: retryCustomer } = await supabase
            .from('customers')
            .select('id, pin_hash, pin_enrolled')
            .eq('tiktok_handle', normalizedHandle)
            .maybeSingle();
          if (retryCustomer) {
            setCustomerId(retryCustomer.id);
            if (!retryCustomer.pin_enrolled || !retryCustomer.pin_hash) {
              setStep('create-pin');
            } else {
              setStep('enter-pin');
            }
            return;
          }
          throw new Error('Could not initialize your account. Please try again.');
        }

        setCustomerId(newCustomer.id);
        setStep('create-pin');
        return;
      }

      // No customer record and no orders — handle not found
      throw new Error('TikTok Handle not found. Please check your handle and try again.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not verify your handle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2a: Authenticate with existing PIN
  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits.'); return; }
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const rawHandle = handle.trim().replace(/^@/, '');
      const normalizedHandle = '@' + rawHandle;
      const hashedPin = await hashPin(pin);

      // Verify PIN against customers table
      const { data: customer } = await supabase
        .from('customers')
        .select('id, pin_hash, pin_enrolled')
        .eq('id', customerId)
        .maybeSingle();

      if (!customer || !customer.pin_enrolled) {
        throw new Error('Account not found. Please start over.');
      }

      if (hashedPin !== customer.pin_hash) {
        throw new Error('Incorrect PIN.');
      }

      // Fetch orders — search both '@handle' and 'handle' variants
      const { data: orderData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .in('tiktok_handle', [normalizedHandle, rawHandle])
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;

      setOrders((orderData ?? []) as Order[]);
      setStep('orders');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2b: Create new PIN
  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setError('PIN must be exactly 4 digits.'); return; }
    if (newPin !== confirmPin) { setError('PINs do not match. Please try again.'); return; }
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const rawHandle = handle.trim().replace(/^@/, '');
      const normalizedHandle = '@' + rawHandle;
      const hashedPin = await hashPin(newPin);

      let cid = customerId;

      // If we don't have a customerId yet, create the customer record
      if (!cid) {
        const { data: newCustomer, error: insertErr } = await supabase
          .from('customers')
          .insert({ tiktok_handle: normalizedHandle, pin_hash: hashedPin, pin_enrolled: true })
          .select('id')
          .single();

        if (insertErr) {
          // Try upsert
          const { data: upserted } = await supabase
            .from('customers')
            .upsert({ tiktok_handle: normalizedHandle, pin_hash: hashedPin, pin_enrolled: true }, { onConflict: 'tiktok_handle' })
            .select('id')
            .single();
          if (upserted) cid = upserted.id;
          else throw new Error('Could not create your account. Please try again.');
        } else if (newCustomer) {
          cid = newCustomer.id;
        }
      } else {
        // Update existing customer record
        const { error: updateErr } = await supabase
          .from('customers')
          .update({ pin_hash: hashedPin, pin_enrolled: true })
          .eq('id', cid);

        if (updateErr) throw updateErr;
      }

      // Fetch orders — search both '@handle' and 'handle' variants
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .in('tiktok_handle', [normalizedHandle, rawHandle])
        .order('created_at', { ascending: false });

      setOrders((orderData ?? []) as Order[]);
      setStep('orders');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(o => !['Completed', 'Cancelled', 'Abandoned'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'Completed');
  const cancelledOrders = orders.filter(o => ['Cancelled', 'Abandoned'].includes(o.status));

  return (
    <div className="content-wrapper py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Order Tracker ✦
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          My Orders
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          {step === 'handle' && 'Enter your TikTok handle to access your order history.'}
          {step === 'enter-pin' && 'Enter your 4-digit PIN to view your orders.'}
          {step === 'create-pin' && 'Create a 4-digit PIN to secure your order history.'}
          {step === 'orders' && `Showing orders for @${handle.replace(/^@/, '')}`}
        </p>
      </div>

      {/* Step 1: Handle lookup */}
      {step === 'handle' && (
        <div className="max-w-md mx-auto mb-10">
          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
          >
            <form onSubmit={handleCheckHandle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  TikTok Handle <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  ref={handleInputRef}
                  type="text"
                  required
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                  className="input-field"
                  placeholder="@yourtiktok"
                  suppressHydrationWarning
                />
              </div>
              {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm"
                style={{ opacity: loading ? 0.7 : 1 }}
                suppressHydrationWarning
              >
                {loading ? 'Checking...' : 'Continue →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Step 2a: Enter existing PIN */}
      {step === 'enter-pin' && (
        <div className="max-w-md mx-auto mb-10">
          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs text-center mb-4" style={{ color: 'var(--foreground-subtle)' }}>
              Welcome back, <strong style={{ color: 'var(--primary-bright)' }}>@{handle.replace(/^@/, '')}</strong>
            </p>
            <form onSubmit={handlePinLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  4-Digit PIN <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  ref={pinInputRef}
                  type="password"
                  required
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-field text-center tracking-widest"
                  placeholder="••••"
                  inputMode="numeric"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                  Use the PIN you set when placing your order.
                </p>
              </div>
              {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm"
                style={{ opacity: loading ? 0.7 : 1 }}
                suppressHydrationWarning
              >
                {loading ? 'Verifying...' : 'View My Orders ✦'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('handle'); setPin(''); setError(''); setCustomerId(''); }}
                className="block w-full text-center text-xs mt-2"
                style={{ color: 'var(--foreground-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ← Change Handle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Step 2b: Create new PIN */}
      {step === 'create-pin' && (
        <div className="max-w-md mx-auto mb-10">
          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs text-center mb-1" style={{ color: 'var(--foreground-subtle)' }}>
              Welcome, <strong style={{ color: 'var(--primary-bright)' }}>@{handle.replace(/^@/, '')}</strong>!
            </p>
            <p className="text-xs text-center mb-4" style={{ color: 'var(--foreground-subtle)' }}>
              Create a 4-digit PIN to secure your order history.
            </p>
            <form onSubmit={handleCreatePin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  New 4-Digit PIN <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  ref={newPinInputRef}
                  type="password"
                  required
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-field text-center tracking-widest"
                  placeholder="••••"
                  inputMode="numeric"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Confirm PIN <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-field text-center tracking-widest"
                  placeholder="••••"
                  inputMode="numeric"
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
              <div
                className="rounded-lg p-3 text-xs"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--foreground-subtle)' }}
              >
                ✦ Your PIN is hashed and stored securely. It cannot be viewed by anyone.
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm"
                style={{ opacity: loading ? 0.7 : 1 }}
                suppressHydrationWarning
              >
                {loading ? 'Saving...' : 'Create PIN & View Orders ✦'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('handle'); setNewPin(''); setConfirmPin(''); setError(''); setCustomerId(''); }}
                className="block w-full text-center text-xs mt-2"
                style={{ color: 'var(--foreground-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ← Change Handle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Step 3: Orders view */}
      {step === 'orders' && (
        <div className="max-w-3xl mx-auto">
          {orders.length === 0 ? (
            /* Empty state — not an error */
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              <div className="text-4xl mb-4">📚</div>
              <h2 className="font-display text-xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                No orders recorded yet
              </h2>
              <p className="text-sm max-w-sm mx-auto mb-6" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
                You haven&apos;t placed any orders yet. Once you reserve your first book, you&apos;ll be able to track your payment status, estimated arrival, shipping updates, and complete order history here.
              </p>
              <Link href="/shop" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm">
                Browse Books
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>
                  Found <strong style={{ color: 'var(--foreground)' }}>{orders.length}</strong> order{orders.length !== 1 ? 's' : ''} for <strong style={{ color: 'var(--primary-bright)' }}>@{handle.replace(/^@/, '')}</strong>
                </p>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {[
                  { key: 'active', label: `Active (${activeOrders.length})` },
                  { key: 'completed', label: `Completed (${completedOrders.length})` },
                  { key: 'cancelled', label: `Cancelled (${cancelledOrders.length})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Order list */}
              {activeTab === 'active' && (
                <div className="space-y-4">
                  {activeOrders.length === 0 ? (
                    <div className="rounded-xl p-10 text-center" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No active orders.</p>
                    </div>
                  ) : activeOrders.map(o => <OrderCard key={o.id} order={o} />)}
                </div>
              )}

              {activeTab === 'completed' && (
                <div className="space-y-4">
                  {completedOrders.length === 0 ? (
                    <div className="rounded-xl p-10 text-center" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No completed orders yet.</p>
                    </div>
                  ) : completedOrders.map(o => <OrderCard key={o.id} order={o} />)}
                </div>
              )}

              {activeTab === 'cancelled' && (
                <div className="space-y-4">
                  {cancelledOrders.length === 0 ? (
                    <div className="rounded-xl p-10 text-center" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No cancelled orders.</p>
                    </div>
                  ) : cancelledOrders.map(o => <OrderCard key={o.id} order={o} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
