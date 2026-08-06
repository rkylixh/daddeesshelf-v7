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
  is_preorder: boolean;
  created_at: string;
}

// Payment / order lifecycle statuses ONLY — no shipment statuses here
const ORDER_STATUSES = [
  'Pending',
  'Fully Paid',
  'Payment Verified',
  'Packed',
  'Waiting for Courier',
  'Replaced',
  'Abandoned',
  'Cancelled',
  'Buyers Remorse',
  'Refunded',
];

// Preorder-specific statuses
const PREORDER_STATUSES = [
  'Pending Payment Verification',
  'Payment Verified',
  'Supplier Ordered',
  'Arrived',
  'Packed',
  'Shipped',
  'Completed',
  'Cancelled',
  'Refunded',
  'Abandoned',
];

// Shipment processing statuses (full courier lifecycle) — separate dropdown
const PROCESSING_STATUSES = [
  'Preparing',
  'Ready for Pickup',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delivery Attempted',
  'Delivered',
  'Returned to Sender',
  'On Hold',
  'Delayed',
  'Lost',
  'Damaged',
];

const STATUS_COLORS: Record<string, string> = {
  'Pending': '#f59e0b',
  'Fully Paid': '#10b981',
  'Payment Verified': '#10b981',
  'Packed': '#3b82f6',
  'Shipped': '#8b5cf6',
  'Delivered': '#10b981',
  'Cancelled': '#6b7280',
  'Refunded': '#ef4444',
  'Waiting for Courier': '#f97316',
  'Abandoned': '#6b7280',
  'Replaced': '#06b6d4',
  'Buyers Remorse': '#a78bfa',
  'Pending Payment Verification': '#f59e0b',
  'Supplier Ordered': '#3b82f6',
  'Arrived': '#06b6d4',
  'Completed': '#10b981',
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

function hasOrderAccess() {
  const session = getAdminSession();
  return session?.role === 'Owner' || session?.role === 'Developer';
}

async function logAudit(params: {
  action: string;
  module: string;
  target_ref: string;
  prev_value?: string;
  new_value?: string;
  explanation?: string;
  notes?: string;
}) {
  const session = getAdminSession();
  await supabase.from('audit_logs').insert({
    admin_handle: session?.tiktok_handle ?? 'unknown',
    action: params.action,
    module: params.module,
    target_ref: params.target_ref,
    prev_value: params.prev_value ?? '',
    new_value: params.new_value ?? '',
    explanation: params.explanation ?? '',
    notes: params.notes ?? '',
  });
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
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!input.trim()) { toast.error('Please paste the reference number'); return; }
    if (input.trim().toLowerCase() !== (order.payment_ref ?? '').trim().toLowerCase()) {
      toast.error('Reference number does not match. Please verify and try again.');
      return;
    }
    setLoading(true);
    const newStatus = order.is_preorder ? 'Payment Verified' : 'Fully Paid';
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, is_reviewed: true })
      .eq('id', order.id);
    if (error) {
      toast.error('Failed to confirm payment: ' + (error.message ?? 'Unknown error'));
      setLoading(false);
      return;
    }

    await logAudit({
      action: 'PAYMENT_CONFIRMED',
      module: 'Orders',
      target_ref: order.ref_number,
      prev_value: order.status,
      new_value: newStatus,
      explanation: `Payment confirmed for order ${order.ref_number} (${order.tiktok_handle}). Ref: ${input.trim()}`,
      notes,
    });

    toast.success(`Payment confirmed — order marked as ${newStatus}`);
    onConfirmed();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
        <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--foreground)' }}>Confirm Payment</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--foreground-muted)' }}>
          Order <span className="font-mono font-semibold">{order.ref_number}</span> · {order.customer_name || order.tiktok_handle}
        </p>

        <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--foreground-muted)' }}>Customer-provided reference number:</p>
          <p className="font-mono text-sm font-semibold" style={{ color: 'var(--primary-bright)' }}>
            {order.payment_ref || <span style={{ color: 'var(--foreground-subtle)' }}>No reference provided</span>}
          </p>
        </div>

        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
          Paste reference number to confirm: *
        </label>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste reference number here..."
          className="input-field text-sm w-full mb-3"
          autoFocus
        />

        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add notes for this action..."
          rows={2}
          className="input-field text-sm w-full mb-4 resize-none"
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
  const [notes, setNotes] = useState('');
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

    // If Store Credit — auto-create a pending (inactive) store credit entry
    if (refundType === 'Store Credit') {
      const session = getAdminSession();
      await supabase.from('store_credits').insert({
        tiktok_handle: order.tiktok_handle,
        amount,
        reason: 'Refund Compensation',
        issued_by: session?.tiktok_handle ?? 'admin',
        status: 'Active',
        is_active: false, // Pending activation by admin
        order_ref: order.ref_number,
      });
    }

    await logAudit({
      action: 'ORDER_REFUNDED',
      module: 'Orders',
      target_ref: order.ref_number,
      prev_value: order.status,
      new_value: 'Refunded',
      explanation: `Refund of ₱${amount} processed for order ${order.ref_number} (${order.tiktok_handle}). Type: ${refundType}. Ref: ${refundRef.trim()}${refundType === 'Store Credit' ? ' — Store credit entry created (pending activation).' : ''}`,
      notes,
    });

    toast.success(
      refundType === 'Store Credit' ?'Refund recorded. Store credit entry created — activate it in the Store Credits tab.' :'Refund recorded successfully'
    );
    onRefunded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
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
            {refundType === 'Store Credit' && (
              <div className="mt-2 rounded-lg p-2.5 text-xs" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
                ✦ A store credit entry will be created for <strong>@{order.tiktok_handle}</strong> and will appear in the Store Credits tab pending activation.
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes for this refund..."
              rows={2}
              className="input-field text-sm w-full resize-none"
            />
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

// ── Status Change Modal (with notes) ──────────────────────────────────────
function StatusChangeModal({
  order,
  newStatus,
  onClose,
  onSaved,
}: {
  order: Order;
  newStatus: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);
    if (error) { toast.error('Failed to update status'); setLoading(false); return; }

    await logAudit({
      action: 'ORDER_STATUS_CHANGED',
      module: 'Orders',
      target_ref: order.ref_number,
      prev_value: order.status,
      new_value: newStatus,
      explanation: `Status changed for order ${order.ref_number} (${order.tiktok_handle}): ${order.status} → ${newStatus}`,
      notes,
    });

    toast.success('Order status updated');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
        <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--foreground)' }}>Change Order Status</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--foreground-muted)' }}>
          <span className="font-mono">{order.ref_number}</span>: <span style={{ color: STATUS_COLORS[order.status] ?? '#6b7280' }}>{order.status}</span> → <span style={{ color: STATUS_COLORS[newStatus] ?? '#6b7280' }}>{newStatus}</span>
        </p>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Reason for this status change..."
          rows={3}
          className="input-field text-sm w-full mb-4 resize-none"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--muted)', color: 'var(--foreground-muted)' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--primary)', color: '#1a0a00' }}
          >
            {loading ? 'Saving...' : 'Save Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Order Modal ─────────────────────────────────────────────────────
function DeleteOrderModal({
  order,
  onClose,
  onDeleted,
}: {
  order: Order;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [pin, setPin] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'warn' | 'pin'>('warn');

  const handleDelete = async () => {
    if (!pin.trim()) { toast.error('Please enter your admin PIN'); return; }
    setLoading(true);

    // Verify admin PIN
    const session = getAdminSession();
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('pin_hash, pin_set')
      .eq('tiktok_handle', session?.tiktok_handle ?? '')
      .single();

    if (!adminData?.pin_set || !adminData?.pin_hash) {
      toast.error('No admin PIN configured. Please set a PIN first.');
      setLoading(false);
      return;
    }

    // Hash the entered PIN (same method as admin login — no salt)
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const enteredHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (enteredHash !== adminData.pin_hash) {
      toast.error('Incorrect PIN. Please try again.');
      setPin('');
      setLoading(false);
      return;
    }

    // Restore stock for each item in the order
    if (Array.isArray(order.items) && order.items.length > 0) {
      for (const item of order.items) {
        if (!item.sku) continue;
        const qty = item.qty ?? 1;
        // Get current inventory
        const { data: bookData } = await supabase
          .from('books')
          .select('id, inventory, reserved')
          .eq('sku', item.sku)
          .single();
        if (bookData) {
          await supabase
            .from('books')
            .update({
              inventory: (bookData.inventory ?? 0) + qty,
              reserved: Math.max(0, (bookData.reserved ?? 0) - qty),
            })
            .eq('id', bookData.id);
        }
      }
    }

    // Delete the order
    const { error } = await supabase.from('orders').delete().eq('id', order.id);
    if (error) {
      toast.error('Failed to delete order: ' + error.message);
      setLoading(false);
      return;
    }

    await logAudit({
      action: 'ORDER_DELETED',
      module: 'Orders',
      target_ref: order.ref_number,
      prev_value: order.status,
      new_value: 'DELETED',
      explanation: `Order ${order.ref_number} (${order.tiktok_handle}) deleted by admin. Stock restored for ${order.items?.length ?? 0} item(s).`,
      notes,
    });

    toast.success(`Order ${order.ref_number} deleted. Stock restored.`);
    onDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: 'var(--background-card)', border: '1px solid rgba(239,68,68,0.4)' }}>
        {step === 'warn' ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <span className="text-lg">⚠</span>
              </div>
              <div>
                <h3 className="font-semibold text-base" style={{ color: '#ef4444' }}>Delete Order</h3>
                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>This action cannot be undone</p>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-4 space-y-2" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Order <span className="font-mono">{order.ref_number}</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                {order.customer_name} · {order.tiktok_handle}
              </p>
              {Array.isArray(order.items) && order.items.length > 0 && (
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(239,68,68,0.15)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>Items to be restored to stock:</p>
                  {order.items.map((item, i) => (
                    <p key={i} className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                      ✦ {item.title} ({item.sku}) × {item.qty}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs mb-5" style={{ color: 'var(--foreground-muted)' }}>
              Deleting this order will permanently remove it and restore all item quantities back to inventory. You will need to enter your admin PIN to confirm.
            </p>

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--muted)', color: 'var(--foreground-muted)' }}>
                Cancel
              </button>
              <button
                onClick={() => setStep('pin')}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: '#ef4444', color: '#fff' }}
              >
                Continue to PIN Confirmation →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <span className="text-lg">🔐</span>
              </div>
              <div>
                <h3 className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>Enter Admin PIN</h3>
                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Confirm deletion of <span className="font-mono font-semibold">{order.ref_number}</span></p>
              </div>
            </div>

            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
              Admin PIN *
            </label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter your PIN..."
              className="input-field text-sm w-full mb-3 text-center tracking-widest font-mono"
              inputMode="numeric"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleDelete(); }}
            />

            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
              Admin Note <span className="font-normal" style={{ color: 'var(--foreground-subtle)' }}>(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Reason for deleting this order (visible in audit log)..."
              rows={2}
              className="input-field text-sm w-full mb-4 resize-none"
            />

            <div className="flex gap-2 justify-end">
              <button onClick={() => { setStep('warn'); setPin(''); }} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--muted)', color: 'var(--foreground-muted)' }}>
                ← Back
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || !pin}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: '#ef4444', color: '#fff', opacity: loading || !pin ? 0.6 : 1 }}
              >
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </>
        )}
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
  const [filterType, setFilterType] = useState<'all' | 'order' | 'preorder'>('all');
  const [confirmPaymentOrder, setConfirmPaymentOrder] = useState<Order | null>(null);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [statusChangeOrder, setStatusChangeOrder] = useState<{ order: Order; newStatus: string } | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const ownerAccess = hasOrderAccess();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const updateOrderField = async (id: string, updates: Partial<Order>, auditInfo?: { action: string; prev: string; next: string; field: string }) => {
    const { error } = await supabase.from('orders').update(updates).eq('id', id);
    if (error) { toast.error('Update failed: ' + error.message); return; }
    toast.success('Order updated');
    if (auditInfo) {
      const order = orders.find(o => o.id === id);
      await logAudit({
        action: auditInfo.action,
        module: 'Orders',
        target_ref: order?.ref_number ?? id,
        prev_value: auditInfo.prev,
        new_value: auditInfo.next,
        explanation: `${auditInfo.field} updated for order ${order?.ref_number ?? id} (${order?.tiktok_handle ?? ''})`,
      });
    }
    loadOrders();
  };

  const handleStatusChange = (order: Order, newStatus: string) => {
    // Payment Verified requires reference number confirmation
    if (newStatus === 'Payment Verified' || newStatus === 'Fully Paid') {
      setConfirmPaymentOrder(order);
      return;
    }
    // Refunded requires refund details
    if (newStatus === 'Refunded') {
      setRefundOrder(order);
      return;
    }
    // All other status changes go through notes modal
    setStatusChangeOrder({ order, newStatus });
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allStatuses = [...new Set([...ORDER_STATUSES, ...PREORDER_STATUSES])].sort();

  const filtered = orders.filter(o => {
    if (filterType === 'order' && o.is_preorder) return false;
    if (filterType === 'preorder' && !o.is_preorder) return false;
    if (filterStatus && o.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (o.ref_number ?? '').toLowerCase().includes(q) ||
        (o.tiktok_handle ?? '').toLowerCase().includes(q) ||
        (o.customer_name ?? '').toLowerCase().includes(q) ||
        (o.payment_ref ?? '').toLowerCase().includes(q)
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
      {statusChangeOrder && (
        <StatusChangeModal
          order={statusChangeOrder.order}
          newStatus={statusChangeOrder.newStatus}
          onClose={() => setStatusChangeOrder(null)}
          onSaved={loadOrders}
        />
      )}
      {deleteOrder && (
        <DeleteOrderModal
          order={deleteOrder}
          onClose={() => setDeleteOrder(null)}
          onDeleted={loadOrders}
        />
      )}

      {/* Type filter tabs */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'all', label: `All Orders (${orders.length})` },
          { key: 'order', label: `Regular (${orders.filter(o => !o.is_preorder).length})` },
          { key: 'preorder', label: `Preorders (${orders.filter(o => o.is_preorder).length})` },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: filterType === tab.key ? 'var(--primary-glow)' : 'var(--muted)',
              color: filterType === tab.key ? 'var(--primary-bright)' : 'var(--foreground-muted)',
              border: `1px solid ${filterType === tab.key ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + status filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="search"
          placeholder="Search by ref, TikTok handle, name, payment ref..."
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
          {allStatuses.map(s => <option key={s}>{s}</option>)}
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
            const statusColor = STATUS_COLORS[order.status] ?? '#6b7280';
            const statusList = order.is_preorder ? PREORDER_STATUSES : ORDER_STATUSES;
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
                      {order.is_preorder && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--primary-bright)', border: '1px solid rgba(139,92,246,0.3)' }}>
                          Preorder
                        </span>
                      )}
                      {order.is_test && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>[TEST]</span>
                      )}
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: `${statusColor}20`, color: statusColor }}
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
                      <a href={order.tracking_link} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--primary-bright)' }}>
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
                  {/* Order status — only payment/fulfillment states */}
                  <select
                    value={order.status}
                    onChange={e => handleStatusChange(order, e.target.value)}
                    className="select-field text-xs py-1.5 px-2"
                  >
                    {statusList.map(s => <option key={s}>{s}</option>)}
                  </select>

                  {/* Processing status — shipment lifecycle, separate dropdown */}
                  <select
                    value={order.processing_status || 'Preparing'}
                    onChange={async e => {
                      const prev = order.processing_status || 'Preparing';
                      const next = e.target.value;
                      await updateOrderField(order.id, { processing_status: next }, {
                        action: 'PROCESSING_STATUS_CHANGED',
                        prev,
                        next,
                        field: 'Processing status',
                      });
                    }}
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
                      onBlur={async e => {
                        if (e.target.value !== order.waybill_number) {
                          await updateOrderField(order.id, { waybill_number: e.target.value }, {
                            action: 'WAYBILL_UPDATED',
                            prev: order.waybill_number || '',
                            next: e.target.value,
                            field: 'Waybill number',
                          });
                        }
                      }}
                    />
                  ) : (
                    order.waybill_number ? null : (
                      <span className="text-xs px-2 py-1.5 rounded-lg" style={{ background: 'var(--muted)', color: 'var(--foreground-subtle)' }} title="Only the owner can edit the waybill number">
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
                      onBlur={async e => {
                        if (e.target.value !== order.tracking_link) {
                          await updateOrderField(order.id, { tracking_link: e.target.value }, {
                            action: 'TRACKING_LINK_UPDATED',
                            prev: order.tracking_link || '',
                            next: e.target.value,
                            field: 'Tracking link',
                          });
                        }
                      }}
                    />
                  )}
                </div>

                {/* Action buttons row */}
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Confirm payment — owner only, for pending orders with payment ref */}
                  {ownerAccess && (order.status === 'Pending' || order.status === 'Pending Payment Verification') && order.payment_ref && (
                    <button
                      onClick={() => setConfirmPaymentOrder(order)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                    >
                      Confirm Payment
                    </button>
                  )}

                  {/* Refund — owner only */}
                  {ownerAccess && !['Refunded', 'Cancelled', 'Abandoned'].includes(order.status) && (
                    <button
                      onClick={() => setRefundOrder(order)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                      Process Refund
                    </button>
                  )}

                  {/* Delete order — PIN protected */}
                  <button
                    onClick={() => setDeleteOrder(order)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                    title="Delete order and restore stock"
                  >
                    🗑 Delete
                  </button>

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
                      onBlur={async e => {
                        if (e.target.value !== order.order_notes) {
                          await updateOrderField(order.id, { order_notes: e.target.value }, {
                            action: 'ORDER_NOTES_UPDATED',
                            prev: order.order_notes || '',
                            next: e.target.value,
                            field: 'Order notes',
                          });
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
