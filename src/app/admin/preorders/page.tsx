'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminGuard from '../components/AdminGuard';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  ref_number: string;
  customer_name: string;
  tiktok_handle: string;
  items: Array<{ title: string; sku: string; qty: number; price: number }>;
  total_price: number;
  payment_method: string;
  payment_ref: string;
  status: string;
  tracking_status: string;
  waybill_number: string;
  shipment_batch: string;
  is_pile_shipping: boolean;
  admin_notes: string;
  created_at: string;
}

const ORDER_STATUS_FLOW = [
  'Pending Payment Verification',
  'Payment Verified',
  'Supplier Ordered',
  'In Transit',
  'Arrived',
  'Packed',
  'Shipped',
  'Completed',
];

const EXTRA_STATUSES = ['Cancelled', 'Refunded', 'Abandoned'];
const ALL_STATUSES = [...ORDER_STATUS_FLOW, ...EXTRA_STATUSES];

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
  'Refunded': '#ef4444',
  'Abandoned': '#6b7280',
};

function AdminPreordersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    setSaving(id);
    const { error } = await supabase.from('orders').update(updates).eq('id', id);
    if (error) {
      showToast('Update failed: ' + error.message);
    } else {
      showToast('Order updated successfully');
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    }
    setSaving(null);
  };

  const filtered = orders.filter(o => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.ref_number.toLowerCase().includes(q) ||
        o.tiktok_handle.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.payment_ref.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <AdminLayout title="Preorder Management">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold animate-fade-in"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981' }}
        >
          {toast}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="search"
          placeholder="Search by ref, TikTok handle, payment ref..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field text-sm py-2 flex-1 min-w-[200px]"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="select-field text-sm py-2"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{filtered.length} orders</p>
      </div>

      {/* Status flow legend */}
      <div
        className="rounded-xl p-4 mb-6 flex flex-wrap gap-2"
        style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}
      >
        <p className="text-xs font-semibold w-full mb-1" style={{ color: 'var(--foreground-subtle)' }}>Order Status Flow:</p>
        {ORDER_STATUS_FLOW.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: `${STATUS_COLORS[s]}20`, color: STATUS_COLORS[s], border: `1px solid ${STATUS_COLORS[s]}40` }}
            >
              {i + 1}. {s}
            </span>
            {i < ORDER_STATUS_FLOW.length - 1 && <span className="text-xs" style={{ color: 'var(--border)' }}>›</span>}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--foreground-muted)' }}>No orders found.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const statusColor = STATUS_COLORS[order.status] ?? '#6b7280';
            return (
              <div
                key={order.id}
                className="rounded-xl p-5"
                style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-display font-bold text-sm" style={{ color: 'var(--primary-bright)' }}>
                        {order.ref_number}
                      </p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      {order.tiktok_handle}
                      {order.customer_name && order.customer_name !== order.tiktok_handle && ` · ${order.customer_name}`}
                      {' · '}{formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--primary-bright)' }}>
                      ₱{Number(order.total_price).toLocaleString()}
                    </span>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Payment Reference — prominent */}
                <div
                  className="rounded-lg p-3 mb-4 flex items-center justify-between"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
                >
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Payment Reference Number</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>
                      {order.payment_ref || <span style={{ color: 'var(--foreground-subtle)' }}>Not provided</span>}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                    via {order.payment_method || 'N/A'}
                  </p>
                </div>

                {/* Books ordered */}
                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="mb-4 space-y-1">
                    <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-subtle)' }}>Books Ordered</p>
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--foreground-muted)' }}>
                          {item.sku && <span className="font-mono mr-1" style={{ color: 'var(--foreground-subtle)' }}>[{item.sku}]</span>}
                          {item.title} × {item.qty}
                        </span>
                        <span style={{ color: 'var(--foreground-subtle)' }}>₱{Number(item.price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Controls */}
                <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  {/* Status update */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Status:</span>
                    <select
                      value={order.status}
                      onChange={e => updateOrder(order.id, { status: e.target.value })}
                      disabled={saving === order.id}
                      className="select-field text-xs py-1.5 px-2"
                    >
                      {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Tracking number */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Tracking #:</span>
                    <input
                      type="text"
                      defaultValue={order.waybill_number}
                      placeholder="Waybill / tracking #"
                      className="input-field text-xs py-1.5 w-36"
                      onBlur={e => {
                        if (e.target.value !== order.waybill_number) {
                          updateOrder(order.id, { waybill_number: e.target.value });
                        }
                      }}
                    />
                  </div>

                  {/* Shipment batch */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Batch:</span>
                    <input
                      type="text"
                      defaultValue={order.shipment_batch}
                      placeholder="Shipment batch"
                      className="input-field text-xs py-1.5 w-28"
                      onBlur={e => {
                        if (e.target.value !== order.shipment_batch) {
                          updateOrder(order.id, { shipment_batch: e.target.value });
                        }
                      }}
                    />
                  </div>

                  {saving === order.id && (
                    <span className="text-xs" style={{ color: 'var(--primary-bright)' }}>Saving...</span>
                  )}
                </div>

                {/* Admin notes */}
                <div className="mt-3">
                  <textarea
                    rows={2}
                    defaultValue={order.admin_notes}
                    placeholder="Admin notes..."
                    className="input-field text-xs resize-none w-full"
                    onBlur={e => {
                      if (e.target.value !== order.admin_notes) {
                        updateOrder(order.id, { admin_notes: e.target.value });
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminPreordersPage() {
  return (
    <AdminGuard>
      <AdminPreordersContent />
    </AdminGuard>
  );
}
