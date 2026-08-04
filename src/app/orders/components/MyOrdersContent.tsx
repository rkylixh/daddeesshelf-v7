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
}

interface TitleRequest {
  id: string;
  ref_number: string;
  requested_title: string;
  requested_author: string;
  created_at: string;
  status: string;
  admin_notes: string;
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
  'Pending': '#f59e0b',
  'Fully Paid': '#10b981',
  'Packed (old)': '#3b82f6',
  'Shipped (old)': '#8b5cf6',
  'Delivered': '#10b981',
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

const REQUEST_STATUS_COLORS: Record<string, string> = {
  'Pending': '#f59e0b',
  'Noted': '#3b82f6',
  'Added to Batch': '#10b981',
  'Declined': '#6b7280',
};

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

// ── Main Component ─────────────────────────────────────────
export default function MyOrdersContent() {
  const [handle, setHandle] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'requests'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<TitleRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;
    setLoading(true);
    setError('');
    setOrders([]);
    setRequests([]);
    setSearched(false);

    try {
      const [ordersRes, requestsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('tiktok_handle', handle.trim())
          .order('created_at', { ascending: false }),
        supabase
          .from('title_requests')
          .select('*')
          .eq('tiktok_handle', handle.trim())
          .order('created_at', { ascending: false }),
      ]);

      setOrders((ordersRes.data ?? []) as Order[]);
      setRequests((requestsRes.data ?? []) as TitleRequest[]);
      setSearched(true);
    } catch {
      setError('Could not retrieve records. Please check your TikTok handle and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  const activeOrders = orders.filter(o => !['Completed', 'Cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'Completed');
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled');

  return (
    <div className="content-wrapper py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Preorder Lookup ✦
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          My Preorders
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          Look up your preorder status and request history using your TikTok handle.
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
            {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Looking up...' : 'Look Up My Preorders ✦'}
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="max-w-3xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Preorders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Request History ({requests.length})
            </button>
          </div>

          {/* Preorders Tab */}
          {activeTab === 'orders' && (
            <div>
              {orders.length === 0 ? (
                <div
                  className="rounded-xl p-10 text-center"
                  style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
                >
                  <Icon name="ArchiveBoxIcon" size={40} className="mx-auto mb-4" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
                  <h3 className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>
                    No preorders found
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--foreground-subtle)' }}>
                    No preorders found for <strong>{handle}</strong>. Check your TikTok handle spelling.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeOrders.length > 0 && (
                    <div>
                      <h3 className="font-display text-sm font-bold mb-3 px-1" style={{ color: 'var(--primary-bright)' }}>
                        Active Preorders ({activeOrders.length})
                      </h3>
                      <div className="space-y-4">
                        {activeOrders.map(order => (
                          <PreorderCard key={order.id} order={order} formatDate={formatDate} />
                        ))}
                      </div>
                    </div>
                  )}
                  {completedOrders.length > 0 && (
                    <div>
                      <h3 className="font-display text-sm font-bold mb-3 px-1" style={{ color: '#10b981' }}>
                        Completed ({completedOrders.length})
                      </h3>
                      <div className="space-y-4">
                        {completedOrders.map(order => (
                          <PreorderCard key={order.id} order={order} formatDate={formatDate} />
                        ))}
                      </div>
                    </div>
                  )}
                  {cancelledOrders.length > 0 && (
                    <div>
                      <h3 className="font-display text-sm font-bold mb-3 px-1" style={{ color: '#6b7280' }}>
                        Cancelled ({cancelledOrders.length})
                      </h3>
                      <div className="space-y-4">
                        {cancelledOrders.map(order => (
                          <PreorderCard key={order.id} order={order} formatDate={formatDate} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              {requests.length === 0 ? (
                <div
                  className="rounded-xl p-10 text-center"
                  style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
                >
                  <Icon name="BookOpenIcon" size={40} className="mx-auto mb-4" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
                  <h3 className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>
                    No requests found
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--foreground-subtle)' }}>
                    No title requests found for <strong>{handle}</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map(req => (
                    <div
                      key={req.id}
                      className="rounded-xl p-5"
                      style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{req.requested_title}</p>
                          {req.requested_author && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>by {req.requested_author}</p>
                          )}
                          <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                            Ref: {req.ref_number} · {formatDate(req.created_at)}
                          </p>
                          {req.admin_notes && (
                            <p className="text-xs mt-2 italic" style={{ color: 'var(--foreground-muted)' }}>
                              Note: {req.admin_notes}
                            </p>
                          )}
                        </div>
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0"
                          style={{
                            background: `${REQUEST_STATUS_COLORS[req.status] ?? '#6b7280'}20`,
                            color: REQUEST_STATUS_COLORS[req.status] ?? '#6b7280',
                            border: `1px solid ${REQUEST_STATUS_COLORS[req.status] ?? '#6b7280'}40`,
                          }}
                        >
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PreorderCard({ order, formatDate }: { order: Order; formatDate: (d: string) => string }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = STATUS_COLORS[order.status] ?? '#6b7280';
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-sm font-bold" style={{ color: 'var(--primary-bright)' }}>
              {order.ref_number}
            </span>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{
                background: `${statusColor}20`,
                color: statusColor,
                border: `1px solid ${statusColor}40`,
              }}
            >
              {order.status}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
            {formatDate(order.created_at)} · {items.length} {items.length === 1 ? 'title' : 'titles'} · ₱{Number(order.total_price).toLocaleString()}
          </p>
        </div>
        <Icon name={expanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} style={{ color: 'var(--foreground-subtle)', flexShrink: 0 } as React.CSSProperties} />
      </button>

      {expanded && (
        <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="pt-4 space-y-3">
            {/* Items */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground-subtle)' }}>Preordered Titles</p>
              <div className="space-y-1.5">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--foreground-muted)' }} className="truncate pr-2">{item.title}</span>
                    <span className="flex-shrink-0" style={{ color: 'var(--foreground-subtle)' }}>
                      × {item.qty} · ₱{Number(item.price).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span style={{ color: 'var(--foreground-subtle)' }}>Payment Method</span>
                <p className="font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>{order.payment_method || '—'}</p>
              </div>
              <div>
                <span style={{ color: 'var(--foreground-subtle)' }}>Payment Ref</span>
                <p className="font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>{order.payment_ref || '—'}</p>
              </div>
              {order.waybill_number && (
                <div>
                  <span style={{ color: 'var(--foreground-subtle)' }}>Waybill</span>
                  <p className="font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>{order.waybill_number}</p>
                </div>
              )}
              {order.is_pile_shipping && (
                <div>
                  <span style={{ color: 'var(--foreground-subtle)' }}>Shipping</span>
                  <p className="font-semibold mt-0.5" style={{ color: 'var(--primary-bright)' }}>Pile/Bundle</p>
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
