'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabase';

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
      <p className="text-xs font-semibold mb-3" style={{ color: 'var(--foreground-subtle)' }}>Preorder Timeline</p>
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
  const [handle, setHandle] = useState('');
  const [pin, setPin] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) { setError('TikTok Handle is required.'); return; }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits.'); return; }
    setLoading(true);
    setError('');
    setOrders([]);
    setSearched(false);

    try {
      const hashedPin = await hashPin(pin);

      const { data, error: dbErr } = await supabase
        .from('orders')
        .select('*')
        .eq('tiktok_handle', handle.trim())
        .eq('customer_pin', hashedPin)
        .order('created_at', { ascending: false });

      if (dbErr) throw dbErr;

      if (!data || data.length === 0) {
        setError('No orders found. Please check your TikTok handle and PIN.');
        setLoading(false);
        return;
      }

      setOrders(data as Order[]);
      setSearched(true);
    } catch {
      setError('Could not retrieve records. Please check your TikTok handle and PIN.');
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
          My Preorders
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          Track your preorder status using your TikTok handle and 4-digit PIN.
        </p>
      </div>

      {/* Lookup form */}
      <div className="max-w-md mx-auto mb-10">
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
        >
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                TikTok Handle <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={handle}
                onChange={e => setHandle(e.target.value)}
                className="input-field"
                placeholder="@yourtiktok"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                4-Digit PIN <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
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
                Use the PIN you set when placing your preorder.
              </p>
            </div>
            {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Looking up...' : 'Track My Preorders ✦'}
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>
              Found <strong style={{ color: 'var(--foreground)' }}>{orders.length}</strong> preorder{orders.length !== 1 ? 's' : ''} for <strong style={{ color: 'var(--primary-bright)' }}>{handle}</strong>
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
                  <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No active preorders.</p>
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
        </div>
      )}
    </div>
  );
}
