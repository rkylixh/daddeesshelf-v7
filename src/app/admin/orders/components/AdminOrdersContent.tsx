'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
  is_reviewed: boolean;
  is_test: boolean;
  created_at: string;
}

const ORDER_STATUSES = ['Pending', 'Fully Paid', 'Refunded', 'Packed', 'Waiting for Courier', 'Shipped', 'Replaced', 'Abandoned', 'Cancelled', 'Buyers Remorse'];
const TRACKING_STATUSES = ['Preparing', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed', 'Returned', 'Damaged', 'Lost'];

const STATUS_COLORS: Record<string, string> = {
  'Pending': '#f59e0b',
  'Fully Paid': '#10b981',
  'Packed': '#3b82f6',
  'Shipped': '#8b5cf6',
  'Delivered': '#10b981',
  'Cancelled': '#6b7280',
  'Refunded': '#ef4444',
};

export default function AdminOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const { error } = await supabase.from('orders').update(updates).eq('id', id);
    if (error) { toast.error('Update failed'); return; }
    toast.success('Order updated');
    loadOrders();
  };

  const filtered = orders.filter(o => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.ref_number.toLowerCase().includes(q) || o.tiktok_handle.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <AdminLayout title="Order Management">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input type="search" placeholder="Search by ref, handle, name..." value={search} onChange={e => setSearch(e.target.value)} className="input-field text-sm py-2 flex-1 min-w-[200px]" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select-field text-sm py-2">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{filtered.length} orders</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--foreground-muted)' }}>No orders found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="rounded-xl p-5" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{order.ref_number}</p>
                    {order.is_test && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>[TEST]</span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                    {order.customer_name} · {order.tiktok_handle} · {new Date(order.created_at).toLocaleDateString('en-PH')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--primary-bright)' }}>₱{Number(order.total_price).toLocaleString()}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${STATUS_COLORS[order.status] ?? '#6b7280'}20`, color: STATUS_COLORS[order.status] ?? '#6b7280' }}>
                    {order.status}
                  </span>
                </div>
              </div>

              {Array.isArray(order.items) && order.items.length > 0 && (
                <div className="mb-3 space-y-1">
                  {order.items.map((item, i) => (
                    <p key={i} className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      {item.sku} — {item.title} × {item.qty} · ₱{Number(item.price).toLocaleString()}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <select
                  value={order.status}
                  onChange={e => updateOrder(order.id, { status: e.target.value })}
                  className="select-field text-xs py-1.5 px-2"
                >
                  {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <select
                  value={order.tracking_status}
                  onChange={e => updateOrder(order.id, { tracking_status: e.target.value })}
                  className="select-field text-xs py-1.5 px-2"
                  disabled={order.status !== 'Shipped'}
                >
                  {TRACKING_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <input
                  type="text"
                  defaultValue={order.waybill_number}
                  placeholder="Waybill #"
                  className="input-field text-xs py-1.5 w-36"
                  onBlur={e => updateOrder(order.id, { waybill_number: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
