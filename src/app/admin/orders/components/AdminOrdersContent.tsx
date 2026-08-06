'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  processing_status: string;
  waybill_number: string;
  tracking_link: string;
  refund_type: string;
  refund_amount: number | null;
  refund_ref: string;
  admin_notes: string;
  order_notes: string;
  is_reviewed: boolean;
  is_test: boolean;
  created_at: string;
}

// Payment / order lifecycle statuses
const ORDER_STATUSES = [
  'Pending',
  'Fully Paid',
  'Refunded',
  'Packed',
  'Waiting for Courier',
  'Shipped',
  'Replaced',
  'Abandoned',
  'Cancelled',
  'Buyers Remorse',
];

// Shipment processing statuses (full courier lifecycle)
const PROCESSING_STATUSES = [
  'Preparing',           // Order received, being packed
  'Ready for Pickup',    // Packed, waiting for courier to collect
  'Picked Up',           // Courier has collected the parcel
  'In Transit',          // Parcel is moving between hubs
  'Out for Delivery',    // Last-mile delivery in progress
  'Delivery Attempted',  // Courier tried but recipient unavailable
  'Delivered',           // Successfully received by customer
  'Returned to Sender',  // Undeliverable, sent back
  'On Hold',             // Held at courier facility
  'Delayed',             // Shipment delayed (weather, customs, etc.)
  'Lost',                // Parcel cannot be located
  'Damaged',             // Parcel arrived damaged
];

const STATUS_COLORS: Record<string, string> = {
  'Pending': '#f59e0b',
  'Fully Paid': '#10b981',
  'Packed': '#3b82f6',
  'Shipped': '#8b5cf6',
  'Delivered': '#10b981',
  'Cancelled': '#6b7280',
  'Refunded': '#ef4444',
  'Waiting for Courier': '#f97316',
  'Abandoned': '#6b7280',
  'Replaced': '#06b6d4',
  'Buyers Remorse': '#a78bfa',
};

const PROCESSING_COLORS: Record<string, string> = {
  'Preparing': '#f59e0b',
  'Ready for Pickup': '#f97316',
  'Picked Up': '#3b82f6',
  'In Transit': '#8b5cf6',
  'Out for Delivery': '#06b6d4',
  'Delivery Attempted': '#f59e0b',
  'Delivered': '#10b981',
  'Returned to Sender': '#ef4444',
  'On Hold': '#6b7280',
  'Delayed': '#ef4444',
  'Lost': '#dc2626',
  'Damaged': '#dc2626',
};

function getAdminSession() {
  try {
    const raw = sessionStorage.getItem('admin_session');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isOwner() {
  const session = getAdminSession();
  return session?.role === 'Owner';
}

// ── Confirm Payment Modal ──────────────────────────────────────────────────
function ConfirmPaymentModal({
  order,
  onClose,
  onConfirmed,
}: {
  order: Order;
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!input.trim()) { toast.error('Please paste the reference number'); return; }
    if (input.trim() !== order.payment_ref.trim()) {
      toast.error('Reference number does not match. Please verify.');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Fully Paid', is_reviewed: true })
      .eq('id', order.id);
    if (error) { toast.error('Failed to confirm payment'); setLoading(false); return; }
    toast.success('Payment confirmed — order marked as Fully Paid');
    onConfirmed();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
        <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--foreground)' }}>Confirm Payment</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--foreground-muted)' }}>
          Order <span className="font-mono font-semibold">{order.ref_number}</span> · {order.customer_name}
        </p>

        <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--foreground-muted)' }}>Customer-provided reference number:</p>
          <p className="font-mono text-sm font-semibold" style={{ color: 'var(--primary-bright)' }}>
            {order.payment_ref || <span style={{ color: 'var(--foreground-subtle)' }}>No reference provided</span>}
          </p>
        </div>

        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
          Paste reference number to confirm:
        </label>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste reference number here..."
          className="input-field text-sm w-full mb-4"
          autoFocus
        />

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--muted)', color: 'var(--foreground-muted)' }}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--primary)', color: '#1a0a00' }}
          >
            {loading ? 'Confirming...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Refund Modal ───────────────────────────────────────────────────────────
function RefundModal({
  order,
  onClose,
  onRefunded,
}: {
  order: Order;
  onClose: () => void;
  onRefunded: () => void;
}) {
  const [refundRef, setRefundRef] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundType, setRefundType] = useState<'Original Payment Method' | 'Store Credit'>('Original Payment Method');
  const [loading, setLoading] = useState(false);

  const handleRefund = async () => {
    if (!refundRef.trim()) { toast.error('Please paste the refund reference number'); return; }
    const amount = parseFloat(refundAmount);
    if (!refundAmount || isNaN(amount) || amount <= 0) { toast.error('Please enter a valid refund amount'); return; }
    setLoading(true);
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'Refunded',
        refund_ref: refundRef.trim(),
        refund_amount: amount,
        refund_type: refundType,
        refund_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    if (error) { toast.error('Failed to process refund'); setLoading(false); return; }
    toast.success('Refund recorded successfully');
    onRefunded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
        <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--foreground)' }}>Process Refund</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--foreground-muted)' }}>
          Order <span className="font-mono font-semibold">{order.ref_number}</span> · Total: ₱{Number(order.total_price).toLocaleString()}
        </p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
              Refund Reference Number *
            </label>
            <input
              type="text"
              value={refundRef}
              onChange={e => setRefundRef(e.target.value)}
              placeholder="Paste refund reference number..."
              className="input-field text-sm w-full"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
              Amount Refunded (₱) *
            </label>
            <input
              type="number"
              value={refundAmount}
              onChange={e => setRefundAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="input-field text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>
              Refund Type *
            </label>
            <div className="flex gap-2">
              {(['Original Payment Method', 'Store Credit'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setRefundType(type)}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: refundType === type ? 'var(--primary)' : 'var(--muted)',
                    color: refundType === type ? '#1a0a00' : 'var(--foreground-muted)',
                    border: `1px solid ${refundType === type ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--muted)', color: 'var(--foreground-muted)' }}>
            Cancel
          </button>
          <button
            onClick={handleRefund}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#ef4444', color: '#fff' }}
          >
            {loading ? 'Processing...' : 'Record Refund'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdminOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [confirmPaymentOrder, setConfirmPaymentOrder] = useState<Order | null>(null);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const ownerAccess = isOwner();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const { error } = await supabase.from('orders').update(updates).eq('id', id);
    if (error) { toast.error('Update failed'); return; }
    toast.success('Order updated');
    loadOrders();
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = orders.filter(o => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.ref_number.toLowerCase().includes(q) ||
        o.tiktok_handle.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AdminLayout title="Order Management">
      {/* Modals */}
      {confirmPaymentOrder && (
        <ConfirmPaymentModal
          order={confirmPaymentOrder}
          onClose={() => setConfirmPaymentOrder(null)}
          onConfirmed={loadOrders}
        />
      )}
      {refundOrder && (
        <RefundModal
          order={refundOrder}
          onClose={() => setRefundOrder(null)}
          onRefunded={loadOrders}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="search"
          placeholder="Search by ref, handle, name..."
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
          {filtered.map(order => {
            const notesOpen = expandedNotes.has(order.id);
            return (
              <div
                key={order.id}
                className="rounded-xl p-5"
                style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-sm font-mono" style={{ color: 'var(--foreground)' }}>{order.ref_number}</p>
                      {order.is_test && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>[TEST]</span>
                      )}
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: `${STATUS_COLORS[order.status] ?? '#6b7280'}20`, color: STATUS_COLORS[order.status] ?? '#6b7280' }}
                      >
                        {order.status}
                      </span>
                      {order.processing_status && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${PROCESSING_COLORS[order.processing_status] ?? '#6b7280'}20`, color: PROCESSING_COLORS[order.processing_status] ?? '#6b7280', border: `1px solid ${PROCESSING_COLORS[order.processing_status] ?? '#6b7280'}40` }}
                        >
                          {order.processing_status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      {order.customer_name} · {order.tiktok_handle} · {new Date(order.created_at).toLocaleDateString('en-PH')}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--primary-bright)' }}>
                    ₱{Number(order.total_price).toLocaleString()}
                  </span>
                </div>

                {/* Items */}
                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {order.items.map((item, i) => (
                      <p key={i} className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                        {item.sku} — {item.title} × {item.qty} · ₱{Number(item.price).toLocaleString()}
                      </p>
                    ))}
                  </div>
                )}

                {/* Payment reference display */}
                {order.payment_ref && (
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Customer Ref:</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
                      {order.payment_ref}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>via {order.payment_method}</span>
                  </div>
                )}

                {/* Refund info (if refunded) */}
                {order.status === 'Refunded' && (order.refund_ref || order.refund_amount) && (
                  <div className="mb-3 rounded-lg p-2.5 text-xs space-y-0.5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <p style={{ color: '#ef4444' }}>
                      <span className="font-semibold">Refund:</span> ₱{Number(order.refund_amount ?? 0).toLocaleString()} · {order.refund_type}
                    </p>
                    {order.refund_ref && (
                      <p style={{ color: 'var(--foreground-muted)' }}>Ref: <span className="font-mono">{order.refund_ref}</span></p>
                    )}
                  </div>
                )}

                {/* Waybill & tracking link */}
                {(order.waybill_number || order.tracking_link) && (
                  <div className="mb-3 flex items-center gap-3 flex-wrap text-xs">
                    {order.waybill_number && (
                      <span style={{ color: 'var(--foreground-muted)' }}>
                        Waybill: <span className="font-mono font-semibold" style={{ color: 'var(--foreground)' }}>{order.waybill_number}</span>
                      </span>
                    )}
                    {order.tracking_link && (
                      <a
                        href={order.tracking_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: 'var(--primary-bright)' }}
                      >
                        Track Shipment ↗
                      </a>
                    )}
                  </div>
                )}

                {/* Notes display */}
                {order.order_notes && (
                  <div className="mb-3 rounded-lg p-2.5 text-xs" style={{ background: 'var(--muted)', color: 'var(--foreground-muted)' }}>
                    <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Notes: </span>{order.order_notes}
                  </div>
                )}

                {/* Controls row */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {/* Order status */}
                  <select
                    value={order.status}
                    onChange={e => updateOrder(order.id, { status: e.target.value })}
                    className="select-field text-xs py-1.5 px-2"
                  >
                    {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>

                  {/* Processing status — separate menu */}
                  <select
                    value={order.processing_status || 'Preparing'}
                    onChange={e => updateOrder(order.id, { processing_status: e.target.value })}
                    className="select-field text-xs py-1.5 px-2"
                    title="Shipment Processing Status"
                  >
                    {PROCESSING_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>

                  {/* Waybill — owner only */}
                  {ownerAccess ? (
                    <input
                      type="text"
                      defaultValue={order.waybill_number}
                      placeholder="Waybill #"
                      className="input-field text-xs py-1.5 w-32"
                      onBlur={e => {
                        if (e.target.value !== order.waybill_number) {
                          updateOrder(order.id, { waybill_number: e.target.value });
                        }
                      }}
                    />
                  ) : (
                    order.waybill_number ? null : (
                      <span
                        className="text-xs px-2 py-1.5 rounded-lg"
                        style={{ background: 'var(--muted)', color: 'var(--foreground-subtle)' }}
                        title="Only the owner can edit the waybill number"
                      >
                        Waybill: owner only
                      </span>
                    )
                  )}

                  {/* Tracking link — owner only */}
                  {ownerAccess && (
                    <input
                      type="text"
                      defaultValue={order.tracking_link}
                      placeholder="Tracking URL..."
                      className="input-field text-xs py-1.5 w-44"
                      onBlur={e => {
                        if (e.target.value !== order.tracking_link) {
                          updateOrder(order.id, { tracking_link: e.target.value });
                        }
                      }}
                    />
                  )}
                </div>

                {/* Action buttons row */}
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Confirm payment — owner only */}
                  {ownerAccess && order.status === 'Pending' && order.payment_ref && (
                    <button
                      onClick={() => setConfirmPaymentOrder(order)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                    >
                      Confirm Payment
                    </button>
                  )}

                  {/* Refund — owner only */}
                  {ownerAccess && (order.status === 'Fully Paid' || order.status === 'Packed' || order.status === 'Shipped') && (
                    <button
                      onClick={() => setRefundOrder(order)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                      Process Refund
                    </button>
                  )}

                  {/* Notes toggle */}
                  <button
                    onClick={() => toggleNotes(order.id)}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }}
                  >
                    {notesOpen ? 'Hide Notes' : 'Add / Edit Notes'}
                  </button>
                </div>

                {/* Inline notes editor */}
                {notesOpen && (
                  <div className="mt-3">
                    <textarea
                      defaultValue={order.order_notes}
                      placeholder="Add notes for this order..."
                      rows={2}
                      className="input-field text-xs w-full resize-none"
                      onBlur={e => {
                        if (e.target.value !== order.order_notes) {
                          updateOrder(order.id, { order_notes: e.target.value });
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
